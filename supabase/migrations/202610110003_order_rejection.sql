alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check check(status in ('pending','confirmed','rejected'));
alter table public.orders
  add column rejection_reason text not null default '',
  add column rejected_at timestamptz,
  add constraint orders_rejection_reason_check check(status <> 'rejected' or (length(trim(rejection_reason)) between 5 and 1000 and rejected_at is not null));

-- Serialize decisions and email claims on the order row. A final decision cannot be reversed.
create function public.claim_order_notification(p_order_id uuid,p_action text,p_reason text default '')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_order public.orders; v_mail public.email_outbox; v_token uuid; v_retry boolean := p_action='retry-email';
begin
  if p_action is null or p_action not in ('confirm','reject','retry-email') then raise exception 'Invalid action'; end if;
  if p_action='reject' and (p_reason is null or length(trim(p_reason)) not between 5 and 1000 or p_reason ~ '[\x00-\x08\x0B\x0C\x0E-\x1F]') then raise exception 'Invalid rejection reason'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if (p_action='confirm' and v_order.status='rejected') or (p_action='reject' and v_order.status='confirmed') then raise exception 'Order already decided'; end if;
  if p_action='reject' and v_order.status='rejected' and v_order.rejection_reason<>trim(p_reason) then raise exception 'Rejection reason already saved'; end if;
  if v_retry and v_order.status='pending' then raise exception 'Decide the order first'; end if;
  if v_order.status='pending' then
    if p_action='reject' then
      update public.orders set status='rejected',rejection_reason=trim(p_reason),rejected_at=now() where id=p_order_id;
    else
      update public.orders set status='confirmed',confirmed_at=now() where id=p_order_id;
    end if;
    insert into public.email_outbox(order_id) values(p_order_id) on conflict do nothing;
  end if;
  select * into v_mail from public.email_outbox where order_id=p_order_id for update;
  if not found then raise exception 'Order notification not found'; end if;
  if v_mail.status in ('sending','failed') and v_mail.first_attempt_at < now()-interval '23 hours' then
    update public.email_outbox set status='unknown',updated_at=now(),error='Provider reconciliation required' where order_id=p_order_id;
    return jsonb_build_object('claimed',false,'order',public.order_snapshot(p_order_id));
  end if;
  if v_mail.status in ('sent','unknown') or (v_mail.status='failed' and not v_retry)
    or (v_mail.status='sending' and (not v_retry or v_mail.claimed_at > now()-interval '2 minutes')) then
    return jsonb_build_object('claimed',false,'order',public.order_snapshot(p_order_id));
  end if;
  v_token := gen_random_uuid();
  update public.email_outbox set status='sending',claim_token=v_token,claimed_at=now(),attempts=attempts+1,updated_at=now() where order_id=p_order_id;
  return jsonb_build_object('claimed',true,'claimToken',v_token,'payload',v_mail.payload,'order',public.order_snapshot(p_order_id));
end;
$$;
revoke all on function public.claim_order_notification(uuid,text,text) from public,anon,authenticated;
grant execute on function public.claim_order_notification(uuid,text,text) to service_role;

-- Keep the previously deployed confirmation entry point protected against rejected orders.
create or replace function public.claim_confirmation(p_order_id uuid,p_retry boolean default false)
returns jsonb language sql security definer set search_path = '' as $$
  select public.claim_order_notification(p_order_id,case when p_retry then 'retry-email' else 'confirm' end,'');
$$;

create or replace function public.order_snapshot(p_order_id uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',o.id,'name',o.name,'email',o.email,'phone',o.phone,'total',o.total,'status',o.status,'createdAt',o.created_at,'confirmedAt',o.confirmed_at,'rejectedAt',o.rejected_at,'rejectionReason',o.rejection_reason,
    'receiptPath',o.receipt_path,'emailStatus',coalesce(e.status,'not_sent'),'fulfillmentType',o.fulfillment_type,'fulfillmentLabel',o.fulfillment_label,
    'fulfillmentAddress',o.fulfillment_address,'deliveryDate',o.delivery_date,'deliverySlotStart',o.delivery_slot_start,'deliverySlotEnd',o.delivery_slot_end,'deliveryZoneName',o.delivery_zone_name,'deliveryFee',o.delivery_fee,'deliveryZoneId',o.delivery_zone_id,
    'items',(select coalesce(jsonb_agg(jsonb_build_object('productId',i.product_id,'name',i.name,'price',i.price,'quantity',i.quantity) order by i.product_id),'[]'::jsonb) from public.order_items i where i.order_id=o.id))
  from public.orders o left join public.email_outbox e on e.order_id=o.id where o.id=p_order_id;
$$;
