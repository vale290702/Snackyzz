begin;
insert into public.orders(id,idempotency_key,fingerprint,name,email,total,receipt_path) values('00000000-0000-0000-0000-000000000041','refund-test-0001',repeat('c',64),'Buyer','buyer@example.com',2500,'fixture.jpg');
insert into storage.objects(bucket_id,name) values('refund-receipts','00000000-0000-0000-0000-000000000041/refund.jpg');
do $$
declare claim jsonb; blocked boolean := false; path text := '00000000-0000-0000-0000-000000000041/refund.jpg'; frozen jsonb;
begin
 begin
  perform public.claim_order_notification('00000000-0000-0000-0000-000000000041','reject','No hay disponibilidad.','another-order/refund.jpg');
 exception when raise_exception then blocked:=true; end;
 if not blocked then raise exception 'Foreign receipt accepted'; end if;
 claim:=public.claim_order_notification('00000000-0000-0000-0000-000000000041','reject','No hay disponibilidad.',path);
 if claim->'order'->>'refundReceiptPath'<>path then raise exception 'Receipt not snapshotted'; end if;
 frozen:=public.prepare_email('00000000-0000-0000-0000-000000000041',(claim->>'claimToken')::uuid,'{"attachments":[{"content":"fixed-image"}]}');
 perform public.finish_email('00000000-0000-0000-0000-000000000041',(claim->>'claimToken')::uuid,'failed',null,'test');
 claim:=public.claim_order_notification('00000000-0000-0000-0000-000000000041','retry-email');
 if claim->'payload'<>frozen or claim->'order'->>'refundReceiptPath'<>path then raise exception 'Retry lost image'; end if;
 blocked:=false;
 begin
  perform public.claim_order_notification('00000000-0000-0000-0000-000000000041','reject','No hay disponibilidad.',path);
 exception when raise_exception then blocked:=true; end;
 if not blocked then raise exception 'Final receipt replaced'; end if;
 if (select public from storage.buckets where id='refund-receipts') then raise exception 'Refund bucket is public'; end if;
end $$;
rollback;
