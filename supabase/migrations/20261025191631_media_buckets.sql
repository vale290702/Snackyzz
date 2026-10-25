-- Storage buckets for media. Reference data, kept apart from the generated DDL migration.
-- Limits mirror UPLOAD_POLICIES in src/features/media/domain/upload-policy; registration
-- re-checks them, including the smaller logo ceiling inside the shared catalog bucket.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('payment-proofs', 'payment-proofs', false, 5 * 1024 * 1024, array['image/jpeg', 'image/png']),
  ('refund-proofs', 'refund-proofs', false, 5 * 1024 * 1024, array['image/jpeg', 'image/png']),
  ('catalog-images', 'catalog-images', true, 5 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
