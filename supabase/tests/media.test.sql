begin;

create extension if not exists pgtap with schema extensions;

select no_plan();

select has_schema('media');
select has_table('media', 'files', 'media files exists');
select enum_has_labels('media', 'file_purpose', array[
  'payment_proof', 'refund_proof', 'product_image', 'brand_logo', 'message_attachment'
]);
select columns_are('media', 'files', array[
  'id', 'bucket', 'object_path', 'purpose', 'mime_type', 'size_bytes',
  'width', 'height', 'sha256', 'uploaded_by', 'created_at'
]);
select ok((select relrowsecurity from pg_class where oid = 'media.files'::regclass), 'files RLS');
select has_index('media', 'files', 'files_uploaded_by_idx', 'uploaded_by indexed');
select table_privs_are('media', 'files', 'anon', array['SELECT']);
select table_privs_are('media', 'files', 'authenticated', array['SELECT']);
select table_privs_are('media', 'files', 'service_role', array['SELECT', 'INSERT', 'DELETE']);
select policies_are('media', 'files', array['files_catalog_read', 'files_proof_read']);

select ok(not (select public from storage.buckets where id = 'payment-proofs'), 'payment bucket private');
select ok(not (select public from storage.buckets where id = 'refund-proofs'), 'refund bucket private');
select ok((select public from storage.buckets where id = 'catalog-images'), 'catalog bucket public');
select is((select count(*) from storage.buckets where id = 'message-attachments'), 0::bigint, 'messaging bucket deferred');

select table_privs_are('private', 'rate_limits', 'anon', array[]::text[]);
select table_privs_are('private', 'rate_limits', 'authenticated', array[]::text[]);
select table_privs_are('private', 'rate_limits', 'service_role', array[]::text[]);
select ok((select relrowsecurity from pg_class where oid = 'private.rate_limits'::regclass), 'limiter RLS');
select function_privs_are('private', 'consume_rate_limit', array['text', 'integer', 'integer'], 'anon', array[]::text[]);
select function_privs_are('private', 'consume_rate_limit', array['text', 'integer', 'integer'], 'authenticated', array[]::text[]);
select function_privs_are('private', 'consume_rate_limit', array['text', 'integer', 'integer'], 'service_role', array['EXECUTE']);
select function_privs_are('public', 'consume_rate_limit', array['text', 'integer', 'integer'], 'anon', array[]::text[]);
select function_privs_are('public', 'consume_rate_limit', array['text', 'integer', 'integer'], 'authenticated', array[]::text[]);
select function_privs_are('public', 'consume_rate_limit', array['text', 'integer', 'integer'], 'service_role', array['EXECUTE']);

insert into auth.users (id, email)
values
  ('20000000-0000-7000-8000-00000000000a', 'owner@media-pgtap.test'),
  ('20000000-0000-7000-8000-00000000000b', 'staff@media-pgtap.test'),
  ('20000000-0000-7000-8000-00000000000c', 'archived@media-pgtap.test');

insert into access.admins (user_id, display_name, role)
values ('20000000-0000-7000-8000-00000000000a', 'Media Owner', 'owner');

insert into access.admins (user_id, display_name, role, archived_at)
values
  ('20000000-0000-7000-8000-00000000000b', 'Media Staff', 'staff', null),
  ('20000000-0000-7000-8000-00000000000c', 'Media Archived', 'staff', now());

insert into media.files (bucket, object_path, purpose, mime_type, size_bytes, sha256)
values
  ('payment-proofs', 'pgtap/payment.jpg', 'payment_proof', 'image/jpeg', 1, 'test'),
  ('refund-proofs', 'pgtap/refund.jpg', 'refund_proof', 'image/jpeg', 1, 'test'),
  ('catalog-images', 'pgtap/product.jpg', 'product_image', 'image/jpeg', 1, 'test'),
  ('catalog-images', 'pgtap/brand.jpg', 'brand_logo', 'image/jpeg', 1, 'test'),
  ('message-attachments', 'pgtap/message.jpg', 'message_attachment', 'image/jpeg', 1, 'test');

insert into storage.objects (bucket_id, name)
values
  ('payment-proofs', 'pgtap/payment.jpg'),
  ('refund-proofs', 'pgtap/refund.jpg'),
  ('catalog-images', 'pgtap/catalog.jpg');

set local role anon;
select is((select count(*) from media.files where object_path like 'pgtap/%'), 2::bigint, 'anonymous sees catalog metadata only');
select is((select count(*) from storage.objects where name like 'pgtap/%'), 1::bigint, 'anonymous sees catalog objects only');
select throws_ok($$insert into media.files (bucket, object_path, purpose, mime_type, size_bytes, sha256)
  values ('payment-proofs', 'blocked', 'payment_proof', 'image/jpeg', 1, 'x')$$,
  '42501', null, 'anonymous cannot register files directly');
reset role;

set local role authenticated;
select is((select count(*) from media.files where object_path like 'pgtap/%'), 2::bigint, 'nonadmin sees catalog metadata only');
select is((select count(*) from storage.objects where name like 'pgtap/%'), 1::bigint, 'nonadmin sees catalog objects only');
reset role;

select set_config('request.jwt.claim.sub', '20000000-0000-7000-8000-00000000000b', true);
set local role authenticated;
select is((select count(*) from media.files where object_path like 'pgtap/%'), 4::bigint, 'orders.view sees both proofs plus catalog');
select is((select count(*) from storage.objects where name like 'pgtap/%'), 3::bigint, 'orders.view sees proof objects');
select throws_ok($$delete from media.files where object_path like 'pgtap/%'$$, '42501', null, 'staff cannot delete metadata');
reset role;

select set_config('request.jwt.claim.sub', '20000000-0000-7000-8000-00000000000c', true);
set local role authenticated;
select is((select count(*) from media.files where object_path like 'pgtap/%'), 2::bigint, 'archived admin cannot see proofs');
select is((select count(*) from storage.objects where name like 'pgtap/%'), 1::bigint, 'archived admin cannot see proof objects');
reset role;

select set_config('request.jwt.claim.sub', '20000000-0000-7000-8000-00000000000a', true);
set local role authenticated;
select is((select count(*) from media.files where object_path like 'pgtap/%'), 4::bigint, 'owner sees proof metadata');
select is((select count(*) from storage.objects where name like 'pgtap/%'), 3::bigint, 'owner sees proof objects');
reset role;

set local role service_role;
select is((select count(*) from storage.objects where name like 'pgtap/%'), 3::bigint, 'service can see all objects');
select is((select count(*) from media.files where object_path like 'pgtap/%'), 5::bigint, 'service can read all metadata');
select ok(public.consume_rate_limit('pgtap-limiter', 2, 600), 'first request accepted');
select ok(public.consume_rate_limit('pgtap-limiter', 2, 600), 'second request accepted');
select ok(not public.consume_rate_limit('pgtap-limiter', 2, 600), 'third request refused');
reset role;
select is((select count(*) from private.rate_limits where key = 'pgtap-limiter'), 1::bigint, 'one row per key');
update private.rate_limits set window_started_at = now() - interval '11 minutes' where key = 'pgtap-limiter';
set local role service_role;
select ok(public.consume_rate_limit('pgtap-limiter', 2, 600), 'expired window resets');
reset role;

select * from finish();
rollback;
