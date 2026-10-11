-- Execute on a disposable database after all migrations; fixtures roll back.
begin;
insert into public.orders(id,idempotency_key,fingerprint,name,email,total,receipt_path) values
('00000000-0000-0000-0000-000000000031','reject-test-0001',repeat('a',64),'Test Buyer','buyer@example.com',2500,'reject-fixture.jpg'),
('00000000-0000-0000-0000-000000000032','reject-test-0002',repeat('b',64),'Test Buyer','buyer@example.com',2500,'confirm-fixture.jpg');
do $$
declare claim jsonb; repeat_claim jsonb; snapshot jsonb; frozen jsonb; reason text := 'El comprobante no coincide con el monto del pedido.'; blocked boolean;
begin
  blocked := false;
  begin
    perform public.claim_order_notification('00000000-0000-0000-0000-000000000031','reject','');
  exception when raise_exception then
    if SQLERRM <> 'Invalid rejection reason' then raise; end if;
    blocked := true;
  end;
  if not blocked then raise exception 'Empty reason accepted'; end if;
  claim := public.claim_order_notification('00000000-0000-0000-0000-000000000031','reject',reason);
  if not (claim->>'claimed')::boolean or claim->'order'->>'status' <> 'rejected' or claim->'order'->>'rejectionReason' <> reason then raise exception 'Rejection not snapshotted'; end if;
  repeat_claim := public.claim_order_notification('00000000-0000-0000-0000-000000000031','reject',reason);
  if (repeat_claim->>'claimed')::boolean then raise exception 'Duplicate rejection mail claim'; end if;
  blocked := false;
  begin
    perform public.claim_confirmation('00000000-0000-0000-0000-000000000031');
  exception when raise_exception then
    if SQLERRM <> 'Order already decided' then raise; end if;
    blocked := true;
  end;
  if not blocked then raise exception 'Rejected order confirmed'; end if;
  blocked := false;
  begin
    perform public.claim_order_notification('00000000-0000-0000-0000-000000000031','reject','Different reason');
  exception when raise_exception then
    if SQLERRM <> 'Rejection reason already saved' then raise; end if;
    blocked := true;
  end;
  if not blocked then raise exception 'Rejection reason overwritten'; end if;
  frozen := public.prepare_email('00000000-0000-0000-0000-000000000031',(claim->>'claimToken')::uuid,jsonb_build_object('text',reason));
  perform public.finish_email('00000000-0000-0000-0000-000000000031',(claim->>'claimToken')::uuid,'failed',null,'provider not configured');
  snapshot := public.order_snapshot('00000000-0000-0000-0000-000000000031');
  if snapshot->>'status' <> 'rejected' or snapshot->>'emailStatus' <> 'failed' then raise exception 'Email failure lost rejection'; end if;
  claim := public.claim_order_notification('00000000-0000-0000-0000-000000000031','retry-email');
  if not (claim->>'claimed')::boolean or claim->'payload' <> frozen then raise exception 'Retry did not reuse rejection payload'; end if;
  if public.prepare_email('00000000-0000-0000-0000-000000000031',(claim->>'claimToken')::uuid,'{"text":"changed"}') <> frozen then raise exception 'Frozen payload changed'; end if;
  perform public.finish_email('00000000-0000-0000-0000-000000000031',(claim->>'claimToken')::uuid,'sent','mail-test');
  claim := public.claim_order_notification('00000000-0000-0000-0000-000000000031','retry-email');
  if (claim->>'claimed')::boolean then raise exception 'Sent notification resent'; end if;
  perform public.claim_confirmation('00000000-0000-0000-0000-000000000032');
  blocked := false;
  begin
    perform public.claim_order_notification('00000000-0000-0000-0000-000000000032','reject',reason);
  exception when raise_exception then
    if SQLERRM <> 'Order already decided' then raise; end if;
    blocked := true;
  end;
  if not blocked then raise exception 'Confirmed order rejected'; end if;
  if has_function_privilege('anon','public.claim_order_notification(uuid,text,text)','execute') or has_function_privilege('authenticated','public.claim_order_notification(uuid,text,text)','execute') then raise exception 'Untrusted caller can decide orders'; end if;
end $$;
rollback;
