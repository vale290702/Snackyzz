-- Shoppers read active rows; catalog managers read everything and write with their own id in the
-- audit columns. Rows are archived, never deleted (DB-07), so there are no delete policies except
-- on category links.
alter table catalog.brands enable row level security;

create policy brands_select_active
on catalog.brands
for select
to anon, authenticated
using (archived_at is null);

create policy brands_select_for_managers
on catalog.brands
for select
to authenticated
using ((select private.has_permission('catalog.manage')));

create policy brands_insert_for_managers
on catalog.brands
for insert
to authenticated
with check (
  (select private.has_permission('catalog.manage'))
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
);

create policy brands_update_for_managers
on catalog.brands
for update
to authenticated
using ((select private.has_permission('catalog.manage')))
with check (
  (select private.has_permission('catalog.manage'))
  and updated_by = (select auth.uid())
);

alter table catalog.categories enable row level security;

create policy categories_select_active
on catalog.categories
for select
to anon, authenticated
using (archived_at is null);

create policy categories_select_for_managers
on catalog.categories
for select
to authenticated
using ((select private.has_permission('catalog.manage')));

create policy categories_insert_for_managers
on catalog.categories
for insert
to authenticated
with check (
  (select private.has_permission('catalog.manage'))
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
);

create policy categories_update_for_managers
on catalog.categories
for update
to authenticated
using ((select private.has_permission('catalog.manage')))
with check (
  (select private.has_permission('catalog.manage'))
  and updated_by = (select auth.uid())
);

alter table catalog.products enable row level security;

create policy products_select_active
on catalog.products
for select
to anon, authenticated
using (archived_at is null);

create policy products_select_for_managers
on catalog.products
for select
to authenticated
using ((select private.has_permission('catalog.manage')));

create policy products_insert_for_managers
on catalog.products
for insert
to authenticated
with check (
  (select private.has_permission('catalog.manage'))
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
);

create policy products_update_for_managers
on catalog.products
for update
to authenticated
using ((select private.has_permission('catalog.manage')))
with check (
  (select private.has_permission('catalog.manage'))
  and updated_by = (select auth.uid())
);

alter table catalog.product_variants enable row level security;

create policy product_variants_select_active
on catalog.product_variants
for select
to anon, authenticated
using (archived_at is null);

create policy product_variants_select_for_managers
on catalog.product_variants
for select
to authenticated
using ((select private.has_permission('catalog.manage')));

create policy product_variants_insert_for_managers
on catalog.product_variants
for insert
to authenticated
with check (
  (select private.has_permission('catalog.manage'))
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
);

create policy product_variants_update_for_managers
on catalog.product_variants
for update
to authenticated
using ((select private.has_permission('catalog.manage')))
with check (
  (select private.has_permission('catalog.manage'))
  and updated_by = (select auth.uid())
);

alter table catalog.product_categories enable row level security;

create policy product_categories_select_active
on catalog.product_categories
for select
to anon, authenticated
using (
  exists (
    select 1
    from catalog.products as products
    where products.id = product_id
      and products.archived_at is null
  )
  and exists (
    select 1
    from catalog.categories as categories
    where categories.id = category_id
      and categories.archived_at is null
  )
);

create policy product_categories_select_for_managers
on catalog.product_categories
for select
to authenticated
using ((select private.has_permission('catalog.manage')));

create policy product_categories_insert_for_managers
on catalog.product_categories
for insert
to authenticated
with check (
  (select private.has_permission('catalog.manage'))
  and created_by = (select auth.uid())
);

create policy product_categories_delete_for_managers
on catalog.product_categories
for delete
to authenticated
using ((select private.has_permission('catalog.manage')));

alter table catalog.variant_price_history enable row level security;

create policy variant_price_history_select_for_managers
on catalog.variant_price_history
for select
to authenticated
using ((select private.has_permission('catalog.manage')));
