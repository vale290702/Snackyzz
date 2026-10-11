alter table public.orders add column refund_receipt_path text;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('refund-receipts','refund-receipts',false,5242880,array['image/jpeg']) on conflict(id) do nothing;

alter function public.claim_order_notification(uuid,text,text) rename to claim_order_notification_without_refund;
create function public.claim_order_notification(p_order_id uuid,p_action text,p_reason text default '',p_refund_path text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_order public.orders;
begin
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if p_refund_path is not null then
    if p_action <> 'reject' or v_order.status <> 'pending' then raise exception 'Refund receipt cannot be changed'; end if;
    if p_refund_path not like p_order_id::text || '/%' or not exists(select 1 from storage.objects where bucket_id='refund-receipts' and name=p_refund_path) then raise exception 'Invalid refund receipt'; end if;
    update public.orders set refund_receipt_path=p_refund_path where id=p_order_id;
  end if;
  return public.claim_order_notification_without_refund(p_order_id,p_action,p_reason);
end;
$$;
revoke all on function public.claim_order_notification(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.claim_order_notification(uuid,text,text,text) to service_role;
create or replace function public.claim_confirmation(p_order_id uuid,p_retry boolean default false)
returns jsonb language sql security definer set search_path='' as $$
 select public.claim_order_notification(p_order_id,case when p_retry then 'retry-email' else 'confirm' end,'',null);
$$;
create or replace function public.order_snapshot(p_order_id uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',o.id,'name',o.name,'email',o.email,'phone',o.phone,'total',o.total,'status',o.status,'createdAt',o.created_at,'confirmedAt',o.confirmed_at,'rejectedAt',o.rejected_at,'rejectionReason',o.rejection_reason,
    'receiptPath',o.receipt_path,'refundReceiptPath',o.refund_receipt_path,'emailStatus',coalesce(e.status,'not_sent'),'fulfillmentType',o.fulfillment_type,'fulfillmentLabel',o.fulfillment_label,
    'fulfillmentAddress',o.fulfillment_address,'deliveryDate',o.delivery_date,'deliverySlotStart',o.delivery_slot_start,'deliverySlotEnd',o.delivery_slot_end,'deliveryZoneName',o.delivery_zone_name,'deliveryFee',o.delivery_fee,'deliveryZoneId',o.delivery_zone_id,
    'items',(select coalesce(jsonb_agg(jsonb_build_object('productId',i.product_id,'name',i.name,'price',i.price,'quantity',i.quantity) order by i.product_id),'[]'::jsonb) from public.order_items i where i.order_id=o.id))
  from public.orders o left join public.email_outbox e on e.order_id=o.id where o.id=p_order_id;
$$;
