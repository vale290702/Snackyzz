-- Integrity guard: while any brand is active, exactly one is primary. The unique index allows at
-- most one; this trigger refuses none. Deferrable, so catalog.set_primary_brand can swap the flag.
create or replace function private.guard_primary_brand()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from catalog.brands as brands
    where brands.archived_at is null
  )
  and not exists (
    select 1
    from catalog.brands as brands
    where brands.is_primary
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'primary_brand_required';
  end if;

  return null;
end;
$$;

revoke execute on function private.guard_primary_brand() from public, anon, authenticated, service_role;

create constraint trigger brands_guard_primary_brand
after insert or update of is_primary, archived_at on catalog.brands
deferrable initially immediate
for each row
execute function private.guard_primary_brand();

-- Integrity guard: a file column only holds files uploaded for that purpose. Arguments: the column
-- name and the media.file_purpose it requires. Runs as the caller, so RLS hides files they can't read.
create or replace function private.require_file_purpose()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_file_id uuid := (to_jsonb(new) ->> tg_argv[0])::uuid;
begin
  if v_file_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from media.files as files
    where files.id = v_file_id
      and files.purpose = tg_argv[1]::media.file_purpose
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'file_purpose_mismatch';
  end if;

  return new;
end;
$$;

revoke execute on function private.require_file_purpose() from public, anon, authenticated, service_role;

create trigger brands_require_logo_purpose
before insert or update of logo_file_id on catalog.brands
for each row
execute function private.require_file_purpose('logo_file_id', 'brand_logo');

create trigger products_require_image_purpose
before insert or update of image_file_id on catalog.products
for each row
execute function private.require_file_purpose('image_file_id', 'product_image');

-- Audit (DB-17): logs every variant price, including the first, with the admin who set it.
create or replace function private.record_variant_price()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into catalog.variant_price_history (
    variant_id,
    price,
    changed_by
  )
  values (
    new.id,
    new.price,
    new.updated_by
  );

  return null;
end;
$$;

revoke execute on function private.record_variant_price() from public, anon, authenticated, service_role;

create trigger product_variants_record_price_on_insert
after insert on catalog.product_variants
for each row
execute function private.record_variant_price();

create trigger product_variants_record_price_on_update
after update of price on catalog.product_variants
for each row
when (old.price is distinct from new.price)
execute function private.record_variant_price();

-- Entry point: makes one active brand primary. Runs as the caller, so RLS requires catalog.manage.
create or replace function catalog.set_primary_brand(p_brand_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  set constraints catalog.brands_guard_primary_brand deferred;

  update catalog.brands as brands
  set
    is_primary = false,
    updated_by = (select auth.uid())
  where brands.is_primary
    and brands.id <> p_brand_id;

  update catalog.brands as brands
  set
    is_primary = true,
    updated_by = (select auth.uid())
  where brands.id = p_brand_id
    and brands.archived_at is null;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'brand_not_found';
  end if;

  set constraints catalog.brands_guard_primary_brand immediate;
end;
$$;

revoke execute on function catalog.set_primary_brand(uuid) from public, anon, authenticated, service_role;

grant execute on function catalog.set_primary_brand(uuid) to authenticated;

-- Entry point: makes one active variant its product's default. Runs as the caller (RLS).
create or replace function catalog.set_default_variant(p_variant_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_product_id uuid;
begin
  select variants.product_id
  into v_product_id
  from catalog.product_variants as variants
  where variants.id = p_variant_id
    and variants.archived_at is null;

  if v_product_id is null then
    raise exception using
      errcode = 'P0001',
      message = 'variant_not_found';
  end if;

  update catalog.product_variants as variants
  set
    is_default = false,
    updated_by = (select auth.uid())
  where variants.product_id = v_product_id
    and variants.is_default
    and variants.id <> p_variant_id;

  update catalog.product_variants as variants
  set
    is_default = true,
    updated_by = (select auth.uid())
  where variants.id = p_variant_id;

  -- Shoppers can read the variant but RLS hides it from the update.
  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'variant_not_found';
  end if;
end;
$$;

revoke execute on function catalog.set_default_variant(uuid) from public, anon, authenticated, service_role;

grant execute on function catalog.set_default_variant(uuid) to authenticated;

-- Entry point: replaces a product's categories in one transaction. Runs as the caller (RLS).
create or replace function catalog.set_product_categories(
  p_product_id uuid,
  p_category_ids uuid[]
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if exists (
    select 1
    from unnest(p_category_ids) as category_ids (category_id)
    where not exists (
      select 1
      from catalog.categories as categories
      where categories.id = category_ids.category_id
        and categories.archived_at is null
    )
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'category_not_found';
  end if;

  delete from catalog.product_categories as links
  where links.product_id = p_product_id
    and links.category_id <> all (p_category_ids);

  insert into catalog.product_categories (
    product_id,
    category_id,
    created_by
  )
  select
    p_product_id,
    category_ids.category_id,
    (select auth.uid())
  from unnest(p_category_ids) as category_ids (category_id)
  on conflict (product_id, category_id) do nothing;
end;
$$;

revoke execute on function catalog.set_product_categories(uuid, uuid[]) from public, anon, authenticated, service_role;

grant execute on function catalog.set_product_categories(uuid, uuid[]) to authenticated;
