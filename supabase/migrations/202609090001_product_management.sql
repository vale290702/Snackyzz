-- Public product photography; all writes continue through the authorized Edge Function.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',true,5242880,array['image/jpeg'])
on conflict(id) do update set public=true, file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

create policy public_product_image_read on storage.objects for select to anon,authenticated
using(bucket_id='product-images');

