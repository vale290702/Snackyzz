-- Package prices are total prices in whole colones. Existing products retain unit pricing.
create function public.valid_cookie_packages(p_packages jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare v_pack jsonb; v_seen integer[] := array[]::integer[]; v_qty integer;
begin
  if p_packages is null or jsonb_typeof(p_packages) <> 'array' then return false; end if;
  if jsonb_array_length(p_packages) > 20 then return false; end if;
  for v_pack in select value from jsonb_array_elements(p_packages) loop
    if jsonb_typeof(v_pack) <> 'object' or jsonb_typeof(v_pack->'quantity') is distinct from 'number'
      or jsonb_typeof(v_pack->'price') is distinct from 'number'
      or (v_pack->>'quantity') !~ '^[0-9]{1,2}$' or (v_pack->>'price') !~ '^[0-9]{1,7}$' then return false; end if;
    v_qty := (v_pack->>'quantity')::integer;
    if v_qty not between 2 and 99 or (v_pack->>'price')::integer not between 1 and 1000000 or v_qty=any(v_seen) then return false; end if;
    v_seen := array_append(v_seen,v_qty);
  end loop;
  return true;
end;
$$;
alter table public.products add column packages jsonb not null default '[]'::jsonb
  check(public.valid_cookie_packages(packages));
alter table public.orders
  add column promo_code text not null default '',
  add column espinal_resident boolean not null default false,
  add constraint valid_espinal_promotion check (promo_code = '' or (promo_code = 'EspinalSnackyzz' and fulfillment_type = 'uber' and espinal_resident));
alter table public.order_items add column line_total integer;
update public.order_items set line_total = price * quantity;
alter table public.order_items alter column line_total set not null;
alter table public.order_items add constraint positive_line_total check(line_total > 0);
drop function public.create_order(text,text,text,text,text,jsonb,text,text,uuid,text,date,time,uuid);
create function public.create_order(
  p_key text, p_fingerprint text, p_name text, p_email text, p_phone text,
  p_items jsonb, p_receipt_path text, p_fulfillment_type text,
  p_pickup_location_id uuid default null, p_delivery_address text default '',
  p_delivery_date date default null, p_delivery_slot_start time default null, p_delivery_zone_id uuid default null, p_promo_code text default '', p_espinal_resident boolean default false
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_existing public.orders; v_order public.orders; v_item jsonb; v_product public.products;
  v_location public.sales_points; v_settings public.store_settings; v_quantity integer; v_total integer := 0;
  v_snapshots jsonb := '[]'::jsonb; v_seen text[] := array[]::text[]; v_label text; v_address text;
  v_zone public.delivery_zones; v_delivery_fee integer := 0; v_zone_name text := '';
  v_line_total integer; v_costs integer[]; v_count integer; v_pack jsonb;
  v_day text; v_hours jsonb; v_slot_end time; v_local_now timestamp;
begin
  if p_key is null or p_fingerprint is null or p_key !~ '^[A-Za-z0-9_-]{8,128}$' or p_fingerprint !~ '^[a-f0-9]{64}$' then raise exception 'Invalid request key'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_key,0));
  select * into v_existing from public.orders where idempotency_key=p_key;
  if found then
    if v_existing.fingerprint <> p_fingerprint then raise exception 'Idempotency conflict'; end if;
    return jsonb_build_object('order',jsonb_build_object('id',v_existing.id,'status',v_existing.status,'total',v_existing.total,'createdAt',v_existing.created_at),'reused',true);
  end if;
  if p_name is null or p_email is null or p_phone is null or length(trim(p_name)) not between 2 and 120 or p_email !~ '^[^[:space:]@,<>]+@[^[:space:]@,<>]+\.[^[:space:]@,<>]+$' or length(p_email)>254 or length(p_phone)>32 then raise exception 'Invalid customer'; end if;
  select * into strict v_settings from public.store_settings where id=1;
  if not v_settings.demo_catalog and (v_settings.sinpe_number='' or v_settings.sinpe_recipient='') then raise exception 'Payment is not configured'; end if;
  if p_fulfillment_type='pickup' then
    select * into v_location from public.sales_points where id=p_pickup_location_id and active for share;
    if not found then raise exception 'Invalid pickup location'; end if;
    v_label := v_location.name; v_address := v_location.address || case when v_location.city='' then '' else ', ' || v_location.city end;
    p_delivery_date := null; p_delivery_slot_start := null; v_slot_end := null;
  elsif p_fulfillment_type='uber' then
    select * into v_zone from public.delivery_zones where id=p_delivery_zone_id and active for share;
    if not found then raise exception 'Invalid delivery zone'; end if;
    v_delivery_fee := v_zone.price; v_zone_name := v_zone.name;
    if not v_settings.uber_delivery_enabled then raise exception 'Messenger delivery disabled'; end if;
    if length(trim(coalesce(p_delivery_address,''))) not between 8 and 300 or p_delivery_address ~ '[\x00-\x08\x0B\x0C\x0E-\x1F]' then raise exception 'Invalid delivery address'; end if;
    if p_delivery_date is null or p_delivery_slot_start is null then raise exception 'Delivery schedule required'; end if;
    v_day := (array['sun','mon','tue','wed','thu','fri','sat'])[extract(dow from p_delivery_date)::integer + 1];
    v_hours := v_settings.delivery_schedule -> v_day;
    if v_hours is null or coalesce((v_hours->>'enabled')::boolean,false)=false then raise exception 'Delivery day unavailable'; end if;
    v_slot_end := p_delivery_slot_start + make_interval(hours=>v_settings.delivery_slot_hours);
    if p_delivery_slot_start < (v_hours->>'start')::time or v_slot_end > (v_hours->>'end')::time
      or mod(extract(epoch from (p_delivery_slot_start-(v_hours->>'start')::time))::integer,v_settings.delivery_slot_hours*3600) <> 0 then raise exception 'Delivery slot unavailable'; end if;
    v_local_now := now() at time zone 'America/Costa_Rica';
    if p_delivery_date + p_delivery_slot_start < v_local_now + make_interval(hours=>v_settings.delivery_lead_hours) then raise exception 'Delivery slot too soon'; end if;
    v_label := 'Envío con mensajero'; v_address := trim(p_delivery_address);
  else raise exception 'Invalid fulfillment type'; end if;
  p_promo_code := trim(coalesce(p_promo_code,''));
  if p_promo_code <> '' then
    if lower(p_promo_code) <> 'espinalsnackyzz' or p_fulfillment_type <> 'uber' or p_espinal_resident is distinct from true then
      raise exception 'Invalid Espinal promotion';
    end if;
    p_promo_code := 'EspinalSnackyzz';
  end if;
  if p_promo_code <> '' then v_delivery_fee := 0; end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 3 then raise exception 'Invalid cart'; end if;
  for v_item in select value from jsonb_array_elements(p_items) order by value->>'productId' loop
    if v_item->'quantity' is null or jsonb_typeof(v_item->'quantity') <> 'number' or (v_item->>'quantity') !~ '^[0-9]{1,2}$' then raise exception 'Invalid quantity'; end if;
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity not between 1 and 99 or (v_item->>'productId')=any(v_seen) then raise exception 'Invalid quantity'; end if;
    select * into v_product from public.products where id=v_item->>'productId' and active for update;
    if not found then raise exception 'Unknown product'; end if;
    v_costs := array[0];
    for v_count in 1..v_quantity loop
      v_line_total := v_costs[v_count] + v_product.price;
      for v_pack in select value from jsonb_array_elements(v_product.packages) loop
        if (v_pack->>'quantity')::integer <= v_count then
          v_line_total := least(v_line_total, v_costs[v_count - (v_pack->>'quantity')::integer + 1] + (v_pack->>'price')::integer);
        end if;
      end loop;
      v_costs := array_append(v_costs, v_line_total);
    end loop;
    v_seen := array_append(v_seen,v_product.id); v_total := v_total + v_line_total;
    v_snapshots := v_snapshots || jsonb_build_array(jsonb_build_object('productId',v_product.id,'name',v_product.name,'price',v_product.price,'quantity',v_quantity,'lineTotal',v_line_total));
  end loop;
  if p_receipt_path is null or p_receipt_path !~ '^[0-9a-f-]{36}\.jpg$' or not exists(select 1 from storage.objects where bucket_id='receipts' and name=p_receipt_path) then raise exception 'Receipt is required'; end if;
  insert into public.orders(idempotency_key,fingerprint,name,email,phone,total,receipt_path,fulfillment_type,fulfillment_label,fulfillment_address,pickup_location_id,delivery_date,delivery_slot_start,delivery_slot_end,delivery_zone_id,delivery_zone_name,delivery_fee,promo_code,espinal_resident)
    values(p_key,p_fingerprint,trim(p_name),p_email,p_phone,v_total+v_delivery_fee,p_receipt_path,p_fulfillment_type,v_label,v_address,p_pickup_location_id,p_delivery_date,p_delivery_slot_start,v_slot_end,case when p_fulfillment_type='uber' then p_delivery_zone_id else null end,v_zone_name,v_delivery_fee,p_promo_code,p_promo_code <> '') returning * into v_order;
  insert into public.order_items(order_id,product_id,name,price,quantity,line_total) select v_order.id,value->>'productId',value->>'name',(value->>'price')::integer,(value->>'quantity')::integer,(value->>'lineTotal')::integer from jsonb_array_elements(v_snapshots);
  return jsonb_build_object('order',jsonb_build_object('id',v_order.id,'status',v_order.status,'total',v_order.total,'createdAt',v_order.created_at),'reused',false);
end;
$$;

revoke all on function public.create_order(text,text,text,text,text,jsonb,text,text,uuid,text,date,time,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.create_order(text,text,text,text,text,jsonb,text,text,uuid,text,date,time,uuid,text,boolean) to service_role;

create or replace function public.order_snapshot(p_order_id uuid) returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',o.id,'name',o.name,'email',o.email,'phone',o.phone,'total',o.total,'status',o.status,'createdAt',o.created_at,'confirmedAt',o.confirmed_at,'confirmationComment',o.confirmation_comment,'rejectedAt',o.rejected_at,'rejectionReason',o.rejection_reason,
    'receiptPath',o.receipt_path,'refundReceiptPath',o.refund_receipt_path,'emailStatus',coalesce(e.status,'not_sent'),'fulfillmentType',o.fulfillment_type,'fulfillmentLabel',o.fulfillment_label,
    'promoCode',o.promo_code,'espinalResident',o.espinal_resident,'fulfillmentAddress',o.fulfillment_address,'deliveryDate',o.delivery_date,'deliverySlotStart',o.delivery_slot_start,'deliverySlotEnd',o.delivery_slot_end,'deliveryZoneName',o.delivery_zone_name,'deliveryFee',o.delivery_fee,'deliveryZoneId',o.delivery_zone_id,
    'items',(select coalesce(jsonb_agg(jsonb_build_object('productId',i.product_id,'name',i.name,'price',i.price,'quantity',i.quantity,'lineTotal',i.line_total) order by i.product_id),'[]'::jsonb) from public.order_items i where i.order_id=o.id))
  from public.orders o left join public.email_outbox e on e.order_id=o.id where o.id=p_order_id;
$$;
