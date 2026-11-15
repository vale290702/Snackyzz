begin;
insert into public.orders(id,idempotency_key,fingerprint,name,email,total,receipt_path) values('00000000-0000-0000-0000-000000000071','comment-test-0001',repeat('a',64),'Buyer','buyer@example.com',2500,'comment-fixture.jpg');
do $$
declare claim jsonb; frozen jsonb; blocked boolean:=false; note text:='Entrega mañana entre 2 y 4 p. m.';
begin
 begin
  perform public.claim_order_notification('00000000-0000-0000-0000-000000000071','confirm',repeat('x',1001));
 exception when raise_exception then blocked:=true; end;
 if not blocked or (select status from public.orders where id='00000000-0000-0000-0000-000000000071')<>'pending' then raise exception 'Invalid comment accepted'; end if;
 claim:=public.claim_order_notification('00000000-0000-0000-0000-000000000071','confirm',note);
 if claim->'order'->>'confirmationComment'<>note then raise exception 'Comment not saved'; end if;
 frozen:=public.prepare_email('00000000-0000-0000-0000-000000000071',(claim->>'claimToken')::uuid,jsonb_build_object('text',note));
 perform public.finish_email('00000000-0000-0000-0000-000000000071',(claim->>'claimToken')::uuid,'failed',null,'test');
 claim:=public.claim_order_notification('00000000-0000-0000-0000-000000000071','retry-email');
 if claim->'payload'<>frozen or claim->'order'->>'confirmationComment'<>note then raise exception 'Retry lost comment'; end if;
 blocked:=false;
 begin
  perform public.claim_order_notification('00000000-0000-0000-0000-000000000071','confirm','Changed comment');
 exception when raise_exception then blocked:=true; end;
 if not blocked then raise exception 'Saved comment overwritten'; end if;
end $$;
rollback;
