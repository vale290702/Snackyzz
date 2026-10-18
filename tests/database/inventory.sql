begin;
update public.store_settings set demo_catalog=true;
insert into public.sales_points(id,name,city,address) values('00000000-0000-0000-0000-000000000050','Inventory pickup','San José','Avenida 1');
insert into public.products(id,name,price,description,tag,image,accent,stock) values('inventory-cookie','Inventory cookie',2500,'Cookie','','/cookie.jpg','brown',2),('inventory-empty','Empty cookie',2500,'Cookie','','/cookie.jpg','brown',0);
insert into storage.objects(bucket_id,name) values('receipts','00000000-0000-0000-0000-000000000050.jpg'),('receipts','00000000-0000-0000-0000-000000000051.jpg'),('receipts','00000000-0000-0000-0000-000000000052.jpg'),('receipts','00000000-0000-0000-0000-000000000053.jpg');
do $$
declare result jsonb; oid uuid; blocked boolean:=false;
begin
 result:=public.create_order('inventory-0001',repeat('a',64),'Buyer','buyer@example.com','', '[{"productId":"inventory-cookie","quantity":2}]','00000000-0000-0000-0000-000000000050.jpg','pickup','00000000-0000-0000-0000-000000000050');
 oid:=(result->'order'->>'id')::uuid;
 if (select stock from public.products where id='inventory-cookie')<>0 then raise exception 'Stock not reserved'; end if;
 perform public.create_order('inventory-0001',repeat('a',64),'Buyer','buyer@example.com','', '[{"productId":"inventory-cookie","quantity":2}]','00000000-0000-0000-0000-000000000050.jpg','pickup','00000000-0000-0000-0000-000000000050');
 if (select stock from public.products where id='inventory-cookie')<>0 then raise exception 'Duplicate reservation'; end if;
 begin
  perform public.create_order('inventory-0002',repeat('b',64),'Buyer','buyer@example.com','', '[{"productId":"inventory-cookie","quantity":1}]','00000000-0000-0000-0000-000000000051.jpg','pickup','00000000-0000-0000-0000-000000000050');
 exception when raise_exception then
  if SQLERRM not like 'Insufficient stock:%' then raise; end if;
  blocked:=true;
 end;
 if not blocked then raise exception 'Oversell accepted'; end if;
 perform public.claim_order_notification(oid,'reject','No hay disponibilidad.');
 perform public.claim_order_notification(oid,'reject','No hay disponibilidad.');
 if (select stock from public.products where id='inventory-cookie')<>2 then raise exception 'Stock not restored exactly once'; end if;
 blocked:=false;
 begin
  perform public.create_order('inventory-0003',repeat('c',64),'Buyer','buyer@example.com','', '[{"productId":"inventory-cookie","quantity":1},{"productId":"inventory-empty","quantity":1}]','00000000-0000-0000-0000-000000000052.jpg','pickup','00000000-0000-0000-0000-000000000050');
 exception when raise_exception then blocked:=true; end;
 if not blocked or (select stock from public.products where id='inventory-cookie')<>2 then raise exception 'Partial reservation not rolled back'; end if;
 result:=public.create_order('inventory-0004',repeat('d',64),'Buyer','buyer@example.com','', '[{"productId":"inventory-cookie","quantity":1}]','00000000-0000-0000-0000-000000000053.jpg','pickup','00000000-0000-0000-0000-000000000050');
 perform public.claim_confirmation((result->'order'->>'id')::uuid);
 if (select stock from public.products where id='inventory-cookie')<>1 then raise exception 'Confirmation deducted stock twice'; end if;
end $$;
rollback;
