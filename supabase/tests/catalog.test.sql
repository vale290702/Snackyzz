begin;

create extension if not exists pgtap with schema extensions;

select no_plan();

-- Shape

select has_schema('catalog');

select tables_are('catalog', array[
  'brands',
  'categories',
  'products',
  'product_categories',
  'product_variants',
  'variant_price_history'
]);

select columns_are('catalog', 'brands', array[
  'id', 'slug', 'name', 'tagline', 'description', 'label', 'is_primary', 'logo_file_id',
  'sort_order', 'archived_at', 'created_at', 'updated_at', 'created_by', 'updated_by'
]);

select columns_are('catalog', 'products', array[
  'id', 'brand_id', 'slug', 'name', 'description', 'badge', 'accent_color', 'image_file_id',
  'sort_order', 'archived_at', 'created_at', 'updated_at', 'created_by', 'updated_by'
]);

select columns_are('catalog', 'product_variants', array[
  'id', 'product_id', 'sku', 'name', 'price', 'is_default', 'is_stock_tracked', 'sort_order',
  'archived_at', 'created_at', 'updated_at', 'created_by', 'updated_by'
]);

select col_type_is('catalog', 'product_variants', 'price', 'amount_crc', 'price is amount_crc');

select columns_are('catalog', 'variant_price_history', array[
  'id', 'variant_id', 'price', 'changed_by', 'changed_at'
]);

select ok(
  (select bool_and(relrowsecurity) from pg_class where relnamespace = 'catalog'::regnamespace and relkind = 'r'),
  'every catalog table has RLS'
);

select has_index('catalog', 'brands', 'brands_is_primary_key', 'one primary brand index');
select has_index('catalog', 'product_variants', 'product_variants_product_id_is_default_key', 'one default variant index');
select has_index('catalog', 'brands', 'brands_logo_file_id_idx', 'logo_file_id indexed');
select has_index('catalog', 'products', 'products_image_file_id_idx', 'image_file_id indexed');
select has_index('catalog', 'product_categories', 'product_categories_category_id_idx', 'category_id indexed');
select has_index('catalog', 'product_variants', 'product_variants_product_id_idx', 'product_id indexed');
select has_index('catalog', 'variant_price_history', 'variant_price_history_variant_id_idx', 'variant_id indexed');

-- Grants

select table_privs_are('catalog', 'brands', 'anon', array['SELECT']);
select table_privs_are('catalog', 'categories', 'anon', array['SELECT']);
select table_privs_are('catalog', 'products', 'anon', array['SELECT']);
select table_privs_are('catalog', 'product_categories', 'anon', array['SELECT']);
select table_privs_are('catalog', 'product_variants', 'anon', array['SELECT']);
select table_privs_are('catalog', 'variant_price_history', 'anon', array[]::text[]);

select table_privs_are('catalog', 'brands', 'authenticated', array['SELECT', 'INSERT', 'UPDATE']);
select table_privs_are('catalog', 'categories', 'authenticated', array['SELECT', 'INSERT', 'UPDATE']);
select table_privs_are('catalog', 'products', 'authenticated', array['SELECT', 'INSERT', 'UPDATE']);
select table_privs_are('catalog', 'product_categories', 'authenticated', array['SELECT', 'INSERT', 'DELETE']);
select table_privs_are('catalog', 'product_variants', 'authenticated', array['SELECT', 'INSERT', 'UPDATE']);
select table_privs_are('catalog', 'variant_price_history', 'authenticated', array['SELECT']);

select table_privs_are('catalog', 'brands', 'service_role', array['SELECT', 'INSERT', 'UPDATE']);
select table_privs_are('catalog', 'categories', 'service_role', array['SELECT', 'INSERT', 'UPDATE']);
select table_privs_are('catalog', 'products', 'service_role', array['SELECT', 'INSERT', 'UPDATE']);
select table_privs_are('catalog', 'product_categories', 'service_role', array['SELECT', 'INSERT', 'DELETE']);
select table_privs_are('catalog', 'product_variants', 'service_role', array['SELECT', 'INSERT', 'UPDATE']);
select table_privs_are('catalog', 'variant_price_history', 'service_role', array['SELECT']);

select function_privs_are('catalog', 'set_primary_brand', array['uuid'], 'anon', array[]::text[]);
select function_privs_are('catalog', 'set_primary_brand', array['uuid'], 'authenticated', array['EXECUTE']);
select function_privs_are('catalog', 'set_primary_brand', array['uuid'], 'service_role', array[]::text[]);
select function_privs_are('catalog', 'set_default_variant', array['uuid'], 'anon', array[]::text[]);
select function_privs_are('catalog', 'set_default_variant', array['uuid'], 'authenticated', array['EXECUTE']);
select function_privs_are('catalog', 'set_default_variant', array['uuid'], 'service_role', array[]::text[]);
select function_privs_are('catalog', 'set_product_categories', array['uuid', 'uuid[]'], 'anon', array[]::text[]);
select function_privs_are('catalog', 'set_product_categories', array['uuid', 'uuid[]'], 'authenticated', array['EXECUTE']);
select function_privs_are('catalog', 'set_product_categories', array['uuid', 'uuid[]'], 'service_role', array[]::text[]);

-- Policies

select policies_are('catalog', 'brands', array[
  'brands_select_active', 'brands_select_for_managers', 'brands_insert_for_managers', 'brands_update_for_managers'
]);
select policies_are('catalog', 'categories', array[
  'categories_select_active', 'categories_select_for_managers', 'categories_insert_for_managers', 'categories_update_for_managers'
]);
select policies_are('catalog', 'products', array[
  'products_select_active', 'products_select_for_managers', 'products_insert_for_managers', 'products_update_for_managers'
]);
select policies_are('catalog', 'product_variants', array[
  'product_variants_select_active', 'product_variants_select_for_managers',
  'product_variants_insert_for_managers', 'product_variants_update_for_managers'
]);
select policies_are('catalog', 'product_categories', array[
  'product_categories_select_active', 'product_categories_select_for_managers',
  'product_categories_insert_for_managers', 'product_categories_delete_for_managers'
]);
select policies_are('catalog', 'variant_price_history', array['variant_price_history_select_for_managers']);

-- Fixtures: an owner (catalog.manage), a staff member, an archived owner and a signed-in customer.
-- The seed's primary brand stays primary; every fixture slug starts with pgtap.

insert into auth.users (id, email)
values
  ('30000000-0000-7000-8000-00000000000a', 'owner@catalog-pgtap.test'),
  ('30000000-0000-7000-8000-00000000000b', 'staff@catalog-pgtap.test'),
  ('30000000-0000-7000-8000-00000000000c', 'archived@catalog-pgtap.test'),
  ('30000000-0000-7000-8000-00000000000d', 'customer@catalog-pgtap.test');

insert into access.admins (user_id, display_name, role, archived_at)
values
  ('30000000-0000-7000-8000-00000000000a', 'Catalog Owner', 'owner', null),
  ('30000000-0000-7000-8000-00000000000b', 'Catalog Staff', 'staff', null),
  ('30000000-0000-7000-8000-00000000000c', 'Catalog Archived', 'owner', now());

insert into media.files (id, bucket, object_path, purpose, mime_type, size_bytes, sha256)
values
  ('30000000-0000-7000-8000-0000000000f1', 'catalog-images', 'pgtap/product.jpg', 'product_image', 'image/jpeg', 1, 'test'),
  ('30000000-0000-7000-8000-0000000000f2', 'catalog-images', 'pgtap/logo.jpg', 'brand_logo', 'image/jpeg', 1, 'test'),
  ('30000000-0000-7000-8000-0000000000f3', 'payment-proofs', 'pgtap/proof.jpg', 'payment_proof', 'image/jpeg', 1, 'test');

insert into catalog.brands (id, slug, name, archived_at)
values
  ('30000000-0000-7000-8000-0000000000b1', 'pgtap-active', 'Active brand', null),
  ('30000000-0000-7000-8000-0000000000b2', 'pgtap-archived', 'Archived brand', now());

insert into catalog.categories (id, slug, name, archived_at)
values
  ('30000000-0000-7000-8000-0000000000c1', 'pgtap-active', 'Active category', null),
  ('30000000-0000-7000-8000-0000000000c2', 'pgtap-archived', 'Archived category', now()),
  ('30000000-0000-7000-8000-0000000000c3', 'pgtap-other', 'Other category', null);

insert into catalog.products (id, brand_id, slug, name, description, accent_color, archived_at)
values
  ('30000000-0000-7000-8000-0000000000d1', '30000000-0000-7000-8000-0000000000b1', 'pgtap-active', 'Active', 'Active product', '#ED781A', null),
  ('30000000-0000-7000-8000-0000000000d2', '30000000-0000-7000-8000-0000000000b1', 'pgtap-archived', 'Archived', 'Archived product', '#ED781A', now());

insert into catalog.product_categories (product_id, category_id)
values
  ('30000000-0000-7000-8000-0000000000d1', '30000000-0000-7000-8000-0000000000c1'),
  ('30000000-0000-7000-8000-0000000000d1', '30000000-0000-7000-8000-0000000000c2'),
  ('30000000-0000-7000-8000-0000000000d2', '30000000-0000-7000-8000-0000000000c1');

insert into catalog.product_variants (id, product_id, sku, name, price, is_default, archived_at)
values
  ('30000000-0000-7000-8000-0000000000e1', '30000000-0000-7000-8000-0000000000d1', 'PGTAP-1', 'Unidad', 2500, true, null),
  ('30000000-0000-7000-8000-0000000000e2', '30000000-0000-7000-8000-0000000000d1', 'PGTAP-6', 'Caja de 6', 14000, false, null),
  ('30000000-0000-7000-8000-0000000000e3', '30000000-0000-7000-8000-0000000000d1', 'PGTAP-OLD', 'Retirada', 9000, false, now());

-- Constraints

select throws_ok(
  $$insert into catalog.brands (slug, name) values ('Not A Slug', 'Bad slug')$$,
  '23514', null, 'brand slugs are lowercase, digits and hyphens'
);
select throws_ok(
  $$insert into catalog.brands (slug, name) values ('pgtap-active', 'Duplicate')$$,
  '23505', null, 'brand slugs are unique'
);
select throws_ok(
  $$insert into catalog.categories (slug, name) values ('pgtap-empty-name', '')$$,
  '23514', null, 'category names are not empty'
);
select throws_ok(
  $$insert into catalog.products (brand_id, slug, name, description, accent_color)
    values ('30000000-0000-7000-8000-0000000000b1', 'pgtap-color', 'Color', 'Bad color', 'orange')$$,
  '23514', null, 'accent colors are #RRGGBB'
);
select throws_ok(
  $$insert into catalog.products (brand_id, slug, name, description, accent_color)
    values ('30000000-0000-7000-8000-0000000000b1', 'pgtap-active', 'Duplicate', 'Same slug', '#000000')$$,
  '23505', null, 'product slugs are unique per brand'
);
select lives_ok(
  $$insert into catalog.products (brand_id, slug, name, description, accent_color)
    values ('00000000-0000-7000-8000-0000000000b1', 'pgtap-active', 'Same slug', 'Other brand', '#000000')$$,
  'the same product slug is allowed in another brand'
);
select throws_ok(
  $$insert into catalog.product_variants (product_id, name, price)
    values ('30000000-0000-7000-8000-0000000000d1', 'Gratis', 0)$$,
  '23514', null, 'variant prices are greater than zero'
);
select throws_ok(
  $$insert into catalog.product_variants (product_id, sku, name, price)
    values ('30000000-0000-7000-8000-0000000000d1', 'PGTAP-1', 'Duplicada', 100)$$,
  '23505', null, 'SKUs are unique'
);
select throws_ok(
  $$update catalog.product_variants set archived_at = now() where id = '30000000-0000-7000-8000-0000000000e1'$$,
  '23514', null, 'the default variant cannot be archived'
);
select throws_ok(
  $$update catalog.brands set archived_at = now() where is_primary$$,
  '23514', null, 'the primary brand cannot be archived'
);

-- One default variant per product

select throws_ok(
  $$update catalog.product_variants set is_default = true where id = '30000000-0000-7000-8000-0000000000e2'$$,
  '23505', null, 'a product cannot have two default variants'
);

-- One primary brand

select throws_ok(
  $$insert into catalog.brands (slug, name, is_primary) values ('pgtap-second-primary', 'Second', true)$$,
  '23505', null, 'there cannot be two primary brands'
);
select throws_ok(
  $$update catalog.brands set is_primary = false where is_primary$$,
  'P0001', 'primary_brand_required', 'the primary brand cannot be unset without a replacement'
);

-- File purposes

select throws_ok(
  $$update catalog.products set image_file_id = '30000000-0000-7000-8000-0000000000f2'
    where id = '30000000-0000-7000-8000-0000000000d1'$$,
  'P0001', 'file_purpose_mismatch', 'a brand logo is not a product image'
);
select throws_ok(
  $$update catalog.brands set logo_file_id = '30000000-0000-7000-8000-0000000000f3'
    where id = '30000000-0000-7000-8000-0000000000b1'$$,
  'P0001', 'file_purpose_mismatch', 'a payment proof is not a brand logo'
);
select lives_ok(
  $$update catalog.products set image_file_id = '30000000-0000-7000-8000-0000000000f1'
    where id = '30000000-0000-7000-8000-0000000000d1'$$,
  'a product image is attached'
);
select lives_ok(
  $$update catalog.brands set logo_file_id = '30000000-0000-7000-8000-0000000000f2'
    where id = '30000000-0000-7000-8000-0000000000b1'$$,
  'a brand logo is attached'
);

-- Price history

select is(
  (select array_agg(price order by price) from catalog.variant_price_history
   where variant_id = '30000000-0000-7000-8000-0000000000e1'),
  array[2500]::public.amount_crc[],
  'a new variant logs its first price'
);

update catalog.product_variants
set
  price = 2700,
  updated_by = '30000000-0000-7000-8000-00000000000a'
where id = '30000000-0000-7000-8000-0000000000e1';

update catalog.product_variants
set name = 'Unidad grande'
where id = '30000000-0000-7000-8000-0000000000e1';

update catalog.product_variants
set price = 2700
where id = '30000000-0000-7000-8000-0000000000e1';

select results_eq(
  $$select price::integer, changed_by from catalog.variant_price_history
    where variant_id = '30000000-0000-7000-8000-0000000000e1' order by changed_at, price$$,
  $$values (2500, null::uuid), (2700, '30000000-0000-7000-8000-00000000000a'::uuid)$$,
  'only real price changes are logged, with who changed them'
);

-- anon

set local role anon;

select is((select count(*) from catalog.brands where slug like 'pgtap-%'), 1::bigint, 'anon sees active brands only');
select is((select count(*) from catalog.categories where slug like 'pgtap-%'), 2::bigint, 'anon sees active categories only');
select is((select count(*) from catalog.products where slug like 'pgtap-%' and brand_id = '30000000-0000-7000-8000-0000000000b1'), 1::bigint, 'anon sees active products only');
select is((select count(*) from catalog.product_variants where sku like 'PGTAP-%'), 2::bigint, 'anon sees active variants only');
select is(
  (select count(*) from catalog.product_categories where product_id::text like '30000000-%'),
  1::bigint,
  'anon sees links between active products and categories only'
);
select throws_ok($$select * from catalog.variant_price_history$$, '42501', null, 'anon cannot read price history');
select throws_ok(
  $$insert into catalog.brands (slug, name) values ('pgtap-anon', 'Anon')$$,
  '42501', null, 'anon cannot create brands'
);
select throws_ok(
  $$select catalog.set_primary_brand('30000000-0000-7000-8000-0000000000b1')$$,
  '42501', null, 'anon cannot set the primary brand'
);

reset role;

-- A signed-in customer, staff and an archived owner get shopper access only.

select set_config('request.jwt.claim.sub', '30000000-0000-7000-8000-00000000000d', true);
set local role authenticated;

select is((select count(*) from catalog.brands where slug like 'pgtap-%'), 1::bigint, 'customers see active brands only');
select is((select count(*) from catalog.product_variants where sku like 'PGTAP-%'), 2::bigint, 'customers see active variants only');
select is((select count(*) from catalog.variant_price_history), 0::bigint, 'customers see no price history');
select throws_ok(
  $$insert into catalog.categories (slug, name, created_by, updated_by)
    values ('pgtap-customer', 'Customer', '30000000-0000-7000-8000-00000000000d', '30000000-0000-7000-8000-00000000000d')$$,
  '42501', null, 'customers cannot create categories'
);

reset role;

select set_config('request.jwt.claim.sub', '30000000-0000-7000-8000-00000000000b', true);
set local role authenticated;

select is((select count(*) from catalog.categories where slug like 'pgtap-%'), 2::bigint, 'staff see active categories only');
select is((select count(*) from catalog.variant_price_history), 0::bigint, 'staff see no price history');
select throws_ok(
  $$insert into catalog.brands (slug, name, created_by, updated_by)
    values ('pgtap-staff', 'Staff', '30000000-0000-7000-8000-00000000000b', '30000000-0000-7000-8000-00000000000b')$$,
  '42501', null, 'staff cannot create brands'
);
select is_empty(
  $$update catalog.products set name = 'Staff edit', updated_by = '30000000-0000-7000-8000-00000000000b'
    where id = '30000000-0000-7000-8000-0000000000d1' returning id$$,
  'staff cannot update products'
);
select is_empty(
  $$delete from catalog.product_categories where product_id = '30000000-0000-7000-8000-0000000000d1' returning product_id$$,
  'staff cannot unlink categories'
);
select throws_ok(
  $$select catalog.set_default_variant('30000000-0000-7000-8000-0000000000e2')$$,
  'P0001', 'variant_not_found', 'staff cannot change the default variant'
);

reset role;

select set_config('request.jwt.claim.sub', '30000000-0000-7000-8000-00000000000c', true);
set local role authenticated;

select is((select count(*) from catalog.brands where slug like 'pgtap-%'), 1::bigint, 'archived owners see active brands only');
select is_empty(
  $$update catalog.brands set name = 'Archived edit', updated_by = '30000000-0000-7000-8000-00000000000c'
    where id = '30000000-0000-7000-8000-0000000000b1' returning id$$,
  'archived owners cannot update brands'
);

reset role;

-- Owner (catalog.manage)

select set_config('request.jwt.claim.sub', '30000000-0000-7000-8000-00000000000a', true);
set local role authenticated;

select is((select count(*) from catalog.brands where slug like 'pgtap-%'), 2::bigint, 'managers see archived brands');
select is((select count(*) from catalog.categories where slug like 'pgtap-%'), 3::bigint, 'managers see archived categories');
select is((select count(*) from catalog.product_variants where sku like 'PGTAP-%'), 3::bigint, 'managers see archived variants');
select is((select count(*) from catalog.product_categories where product_id::text like '30000000-%'), 3::bigint, 'managers see every link');
select is(
  (select count(*) from catalog.variant_price_history where variant_id = '30000000-0000-7000-8000-0000000000e1'),
  2::bigint,
  'managers read price history'
);

select lives_ok(
  $$insert into catalog.categories (slug, name, created_by, updated_by)
    values ('pgtap-owner', 'Owner', '30000000-0000-7000-8000-00000000000a', '30000000-0000-7000-8000-00000000000a')$$,
  'managers create categories as themselves'
);
select throws_ok(
  $$insert into catalog.categories (slug, name, created_by, updated_by)
    values ('pgtap-forged', 'Forged', '30000000-0000-7000-8000-00000000000b', '30000000-0000-7000-8000-00000000000b')$$,
  '42501', null, 'managers cannot create rows in someone else''s name'
);
select isnt_empty(
  $$update catalog.products set name = 'Owner edit', updated_by = '30000000-0000-7000-8000-00000000000a'
    where id = '30000000-0000-7000-8000-0000000000d1' returning id$$,
  'managers update products as themselves'
);
select throws_ok(
  $$update catalog.products set name = 'Forged edit', updated_by = '30000000-0000-7000-8000-00000000000b'
    where id = '30000000-0000-7000-8000-0000000000d1'$$,
  '42501', null, 'managers cannot update rows in someone else''s name'
);
select throws_ok(
  $$delete from catalog.brands where id = '30000000-0000-7000-8000-0000000000b2'$$,
  '42501', null, 'brands are archived, never deleted'
);
select throws_ok(
  $$insert into catalog.variant_price_history (variant_id, price) values ('30000000-0000-7000-8000-0000000000e1', 1)$$,
  '42501', null, 'price history is written only by its trigger'
);

select lives_ok(
  $$select catalog.set_default_variant('30000000-0000-7000-8000-0000000000e2')$$,
  'managers change the default variant'
);
select results_eq(
  $$select sku from catalog.product_variants
    where product_id = '30000000-0000-7000-8000-0000000000d1' and is_default$$,
  $$values ('PGTAP-6'::text)$$,
  'the product keeps exactly one default variant'
);
select throws_ok(
  $$select catalog.set_default_variant('30000000-0000-7000-8000-0000000000e3')$$,
  'P0001', 'variant_not_found', 'an archived variant cannot become the default'
);

select lives_ok(
  $$select catalog.set_primary_brand('30000000-0000-7000-8000-0000000000b1')$$,
  'managers change the primary brand'
);
select results_eq(
  $$select slug from catalog.brands where is_primary$$,
  $$values ('pgtap-active'::text)$$,
  'exactly one brand is primary after the swap'
);
select throws_ok(
  $$select catalog.set_primary_brand('30000000-0000-7000-8000-0000000000b2')$$,
  'P0001', 'brand_not_found', 'an archived brand cannot become primary'
);
select results_eq(
  $$select slug from catalog.brands where is_primary$$,
  $$values ('pgtap-active'::text)$$,
  'a failed swap keeps the primary brand'
);

select lives_ok(
  $$select catalog.set_product_categories(
    '30000000-0000-7000-8000-0000000000d1',
    array['30000000-0000-7000-8000-0000000000c3']::uuid[]
  )$$,
  'managers replace a product''s categories'
);
select results_eq(
  $$select category_id from catalog.product_categories where product_id = '30000000-0000-7000-8000-0000000000d1'$$,
  $$values ('30000000-0000-7000-8000-0000000000c3'::uuid)$$,
  'only the requested categories remain'
);
select throws_ok(
  $$select catalog.set_product_categories(
    '30000000-0000-7000-8000-0000000000d1',
    array['30000000-0000-7000-8000-0000000000c2']::uuid[]
  )$$,
  'P0001', 'category_not_found', 'archived categories cannot be linked'
);

reset role;

-- service_role bypasses RLS for trusted server code.

set local role service_role;

select is((select count(*) from catalog.brands where slug like 'pgtap-%'), 2::bigint, 'service role reads every brand');
select is(
  (select count(*) from catalog.variant_price_history where variant_id = '30000000-0000-7000-8000-0000000000e1'),
  2::bigint,
  'service role reads price history'
);

reset role;

select * from finish();
rollback;
