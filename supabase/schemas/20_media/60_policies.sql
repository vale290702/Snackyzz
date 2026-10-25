create policy files_catalog_read on media.files
for select to anon, authenticated
using (purpose in ('product_image', 'brand_logo'));

create policy files_proof_read on media.files
for select to authenticated
using (
  purpose in ('payment_proof', 'refund_proof')
  and (select private.has_permission('orders.view'))
);

-- Signed upload tokens authorize writes. No anonymous object listing or direct writes.
create policy media_catalog_read on storage.objects
for select to anon, authenticated
using (bucket_id = 'catalog-images');

create policy media_proof_read on storage.objects
for select to authenticated
using (
  bucket_id in ('payment-proofs', 'refund-proofs')
  and (select private.has_permission('orders.view'))
);
