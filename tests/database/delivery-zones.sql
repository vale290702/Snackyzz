-- Run after migrations on a disposable Supabase database. Always rolls back fixtures.
begin;
insert into public.delivery_zones(id,name,price) values('00000000-0000-0000-0000-000000000020','Zone test',2000);
insert into public.sales_points(id,name,city,address) values('00000000-0000-0000-0000-000000000010','Pickup test','San José','Avenida 1');
insert into public.products(id,name,price,description,tag,image,accent) values('zone-test-cookie','Cookie',2500,'Test','','/cookie.jpg','brown');
update public.products set stock=99 where id='zone-test-cookie';
insert into storage.objects(bucket_id,name) values('receipts','00000000-0000-0000-0000-000000000001.jpg'),('receipts','00000000-0000-0000-0000-000000000002.jpg');
update public.store_settings set demo_catalog=true,delivery_lead_hours=0,delivery_schedule='{"mon":{"enabled":true,"start":"09:00","end":"18:00"},"tue":{"enabled":true,"start":"09:00","end":"18:00"},"wed":{"enabled":true,"start":"09:00","end":"18:00"},"thu":{"enabled":true,"start":"09:00","end":"18:00"},"fri":{"enabled":true,"start":"09:00","end":"18:00"},"sat":{"enabled":true,"start":"09:00","end":"18:00"},"sun":{"enabled":true,"start":"09:00","end":"18:00"}}';
do $$
declare result jsonb; snapshot jsonb; rejection boolean := false;
begin
  result := public.create_order('zone-test-0001',repeat('a',64),'Test Buyer','buyer@example.com','', '[{"productId":"zone-test-cookie","quantity":1}]','00000000-0000-0000-0000-000000000001.jpg','uber',null,'Avenida 1, casa 2',current_date+2,'09:00','00000000-0000-0000-0000-000000000020');
  if (result->'order'->>'total')::integer <> 4500 then raise exception 'Delivery fee missing'; end if;
  update public.delivery_zones set name='Renamed zone',price=9000 where id='00000000-0000-0000-0000-000000000020';
  snapshot := public.order_snapshot((result->'order'->>'id')::uuid);
  if snapshot->>'deliveryZoneName' <> 'Zone test' or (snapshot->>'deliveryFee')::integer <> 2000 then raise exception 'Order snapshot changed'; end if;
  result := public.create_order('zone-test-0001',repeat('a',64),'Test Buyer','buyer@example.com','', '[{"productId":"zone-test-cookie","quantity":1}]','00000000-0000-0000-0000-000000000001.jpg','uber',null,'Avenida 1, casa 2',current_date+2,'09:00','00000000-0000-0000-0000-000000000020');
  if not (result->>'reused')::boolean or (result->'order'->>'total')::integer <> 4500 then raise exception 'Idempotency changed price'; end if;
  result := public.create_order('zone-test-0002',repeat('b',64),'Test Buyer','buyer@example.com','', '[{"productId":"zone-test-cookie","quantity":1}]','00000000-0000-0000-0000-000000000002.jpg','pickup','00000000-0000-0000-0000-000000000010','',null,null,'00000000-0000-0000-0000-000000000020');
  if (result->'order'->>'total')::integer <> 2500 then raise exception 'Pickup charged delivery'; end if;
  update public.delivery_zones set active=false;
  begin
    perform public.create_order('zone-test-0003',repeat('c',64),'Test Buyer','buyer@example.com','', '[{"productId":"zone-test-cookie","quantity":1}]','00000000-0000-0000-0000-000000000001.jpg','uber',null,'Avenida 1, casa 2',current_date+2,'09:00','00000000-0000-0000-0000-000000000020');
  exception when raise_exception then
    if SQLERRM <> 'Invalid delivery zone' then raise; end if;
    rejection := true;
  end;
  if not rejection then raise exception 'Inactive zone accepted'; end if;
  rejection := false;
  begin
    perform public.create_order('zone-test-0004',repeat('d',64),'Test Buyer','buyer@example.com','', '[{"productId":"zone-test-cookie","quantity":1}]','00000000-0000-0000-0000-000000000001.jpg','uber',null,'Avenida 1, casa 2',current_date+2,'09:00',null);
  exception when raise_exception then
    if SQLERRM <> 'Invalid delivery zone' then raise; end if;
    rejection := true;
  end;
  if not rejection then raise exception 'Missing zone accepted'; end if;
end $$;
set local role anon;
select id from public.delivery_zones;
rollback;
