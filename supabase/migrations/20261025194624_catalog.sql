set local check_function_bodies = off;

create schema "catalog";

create table "catalog"."brands" (
  "slug"         text                     not null,
  "name"         text                     not null,
  "tagline"      text,
  "description"  text,
  "label"        text,
  "is_primary"   boolean                  not null default false,
  "logo_file_id" uuid,
  "sort_order"   integer                  not null default 0,
  "archived_at"  timestamp with time zone,
  "created_at"   timestamp with time zone not null default now(),
  "updated_at"   timestamp with time zone not null default now(),
  "created_by"   uuid,
  "updated_by"   uuid,
  constraint "brands_description_check"
    check (((char_length(description) >= 1) AND (char_length(description) <= 1000))),
  constraint "brands_label_check"
    check (((char_length(label) >= 1) AND (char_length(label) <= 80))),
  constraint "brands_name_check" check (((char_length(name) >= 1) AND (char_length(name) <= 80))),
  constraint "brands_primary_not_archived_check" check ((NOT (is_primary AND (archived_at IS
    NOT NULL)))),
  constraint "brands_slug_check"
    check
    ((((char_length(slug) >= 1) AND (char_length(slug) <= 60)) AND (slug ~ '^[a-z0-9-]+$'::text))),
  constraint "brands_slug_key" unique (slug),
  constraint "brands_sort_order_check" check ((sort_order >= 0)),
  constraint "brands_tagline_check"
    check (((char_length(tagline) >= 1) AND (char_length(tagline) <= 160))),
  "id"           uuid                     not null default private.uuid_v7(),
  constraint "brands_pkey" primary key (id)
);

alter table "catalog"."brands"
  enable row level security;

create table "catalog"."categories" (
  "slug"        text                     not null,
  "name"        text                     not null,
  "sort_order"  integer                  not null default 0,
  "archived_at" timestamp with time zone,
  "created_at"  timestamp with time zone not null default now(),
  "updated_at"  timestamp with time zone not null default now(),
  "created_by"  uuid,
  "updated_by"  uuid,
  constraint "categories_name_check"
    check (((char_length(name) >= 1) AND (char_length(name) <= 60))),
  constraint "categories_slug_check"
    check
    ((((char_length(slug) >= 1) AND (char_length(slug) <= 60)) AND (slug ~ '^[a-z0-9-]+$'::text))),
  constraint "categories_slug_key" unique (slug),
  constraint "categories_sort_order_check" check ((sort_order >= 0)),
  "id"          uuid                     not null default private.uuid_v7(),
  constraint "categories_pkey" primary key (id)
);

alter table "catalog"."categories"
  enable row level security;

create table "catalog"."product_categories" (
  "product_id"  uuid                     not null,
  "category_id" uuid                     not null,
  "created_at"  timestamp with time zone not null default now(),
  "created_by"  uuid,
  constraint "product_categories_pkey" primary key (product_id, category_id)
);

alter table "catalog"."product_categories"
  enable row level security;

create table "catalog"."product_variants" (
  "product_id"       uuid                     not null,
  "sku"              text,
  "name"             text                     not null,
  "price"            public.amount_crc        not null,
  "is_default"       boolean                  not null default false,
  "is_stock_tracked" boolean                  not null default true,
  "sort_order"       integer                  not null default 0,
  "archived_at"      timestamp with time zone,
  "created_at"       timestamp with time zone not null default now(),
  "updated_at"       timestamp with time zone not null default now(),
  "created_by"       uuid,
  "updated_by"       uuid,
  constraint "product_variants_default_not_archived_check"
    check ((NOT (is_default AND (archived_at IS NOT NULL)))),
  constraint "product_variants_name_check"
    check (((char_length(name) >= 1) AND (char_length(name) <= 60))),
  constraint "product_variants_price_check" check (((price)::integer > 0)),
  constraint "product_variants_sku_check"
    check (((char_length(sku) >= 1) AND (char_length(sku) <= 40))),
  constraint "product_variants_sku_key" unique (sku),
  constraint "product_variants_sort_order_check" check ((sort_order >= 0)),
  "id"               uuid                     not null default private.uuid_v7(),
  constraint "product_variants_pkey" primary key (id)
);

alter table "catalog"."product_variants"
  enable row level security;

create table "catalog"."products" (
  "brand_id"      uuid                     not null,
  "slug"          text                     not null,
  "name"          text                     not null,
  "description"   text                     not null,
  "badge"         text,
  "accent_color"  text                     not null,
  "image_file_id" uuid,
  "sort_order"    integer                  not null default 0,
  "archived_at"   timestamp with time zone,
  "created_at"    timestamp with time zone not null default now(),
  "updated_at"    timestamp with time zone not null default now(),
  "created_by"    uuid,
  "updated_by"    uuid,
  constraint "products_accent_color_check" check ((accent_color ~ '^#[0-9A-Fa-f]{6}$'::text)),
  constraint "products_badge_check"
    check (((char_length(badge) >= 1) AND (char_length(badge) <= 30))),
  constraint "products_brand_id_slug_key" unique (brand_id, slug),
  constraint "products_description_check"
    check (((char_length(description) >= 1) AND (char_length(description) <= 1000))),
  constraint "products_name_check"
    check (((char_length(name) >= 1) AND (char_length(name) <= 120))),
  constraint "products_slug_check"
    check
    ((((char_length(slug) >= 1) AND (char_length(slug) <= 60)) AND (slug ~ '^[a-z0-9-]+$'::text))),
  constraint "products_sort_order_check" check ((sort_order >= 0)),
  "id"            uuid                     not null default private.uuid_v7(),
  constraint "products_pkey" primary key (id)
);

alter table "catalog"."products"
  enable row level security;

create table "catalog"."variant_price_history" (
  "variant_id" uuid                     not null,
  "price"      public.amount_crc        not null,
  "changed_by" uuid,
  "changed_at" timestamp with time zone not null default now(),
  "id"         uuid                     not null default private.uuid_v7(),
  constraint "variant_price_history_pkey" primary key (id)
);

alter table "catalog"."variant_price_history"
  enable row level security;

create or replace function catalog.set_default_variant (
  p_variant_id uuid
)
  returns void
  language plpgsql
  set search_path to ''
  AS $function$
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
$function$;

create or replace function catalog.set_primary_brand (
  p_brand_id uuid
)
  returns void
  language plpgsql
  set search_path to ''
  AS $function$
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
$function$;

create or replace function catalog.set_product_categories (
  p_product_id   uuid,
  p_category_ids uuid[]
)
  returns void
  language plpgsql
  set search_path to ''
  AS $function$
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
$function$;

create or replace function private.guard_primary_brand()
  returns trigger
  language plpgsql
  security definer
  set search_path to ''
  AS $function$
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
$function$;

create or replace function private.record_variant_price()
  returns trigger
  language plpgsql
  security definer
  set search_path to ''
  AS $function$
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
$function$;

create or replace function private.require_file_purpose()
  returns trigger
  language plpgsql
  set search_path to ''
  AS $function$
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
$function$;

alter table "catalog"."brands"
  add constraint "brands_created_by_fkey" foreign key (created_by) references access.admins(user_id);

alter table "catalog"."brands"
  add constraint "brands_logo_file_id_fkey" foreign key (logo_file_id) references media.files(id);

alter table "catalog"."brands"
  add constraint "brands_updated_by_fkey" foreign key (updated_by) references access.admins(user_id);

alter table "catalog"."categories"
  add constraint "categories_created_by_fkey" foreign key (created_by)
    references access.admins(user_id);

alter table "catalog"."categories"
  add constraint "categories_updated_by_fkey" foreign key (updated_by)
    references access.admins(user_id);

alter table "catalog"."product_categories"
  add constraint "product_categories_created_by_fkey" foreign key (created_by)
    references access.admins(user_id);

alter table "catalog"."product_variants"
  add constraint "product_variants_created_by_fkey" foreign key (created_by)
    references access.admins(user_id);

alter table "catalog"."product_variants"
  add constraint "product_variants_updated_by_fkey" foreign key (updated_by)
    references access.admins(user_id);

alter table "catalog"."products"
  add constraint "products_created_by_fkey" foreign key (created_by)
    references access.admins(user_id);

alter table "catalog"."products"
  add constraint "products_image_file_id_fkey" foreign key (image_file_id)
    references media.files(id);

alter table "catalog"."products"
  add constraint "products_updated_by_fkey" foreign key (updated_by)
    references access.admins(user_id);

alter table "catalog"."variant_price_history"
  add constraint "variant_price_history_changed_by_fkey" foreign key (changed_by)
    references access.admins(user_id);

create index brands_created_by_idx on catalog.brands using btree (created_by);

create unique index brands_is_primary_key on catalog.brands using btree (is_primary)
  where is_primary;

create index brands_logo_file_id_idx on catalog.brands using btree (logo_file_id);

create index brands_updated_by_idx on catalog.brands using btree (updated_by);

create index categories_created_by_idx on catalog.categories using btree (created_by);

create index categories_updated_by_idx on catalog.categories using btree (updated_by);

create index product_categories_category_id_idx on catalog.product_categories
  using btree (category_id);

create index product_categories_created_by_idx on catalog.product_categories
  using btree (created_by);

create index product_variants_created_by_idx on catalog.product_variants using btree (created_by);

create index product_variants_product_id_idx on catalog.product_variants using btree (product_id);

create unique index product_variants_product_id_is_default_key on catalog.product_variants
  using btree (product_id)
  where is_default;

create index product_variants_updated_by_idx on catalog.product_variants using btree (updated_by);

create index products_created_by_idx on catalog.products using btree (created_by);

create index products_image_file_id_idx on catalog.products using btree (image_file_id);

create index products_updated_by_idx on catalog.products using btree (updated_by);

create index variant_price_history_changed_by_idx on catalog.variant_price_history
  using btree (changed_by);

create index variant_price_history_variant_id_idx on catalog.variant_price_history
  using btree (variant_id);

create constraint TRIGGER brands_guard_primary_brand
  after insert or update of is_primary, archived_at on catalog.brands deferrable initially IMMEDIATE
  for each row
  execute function private.guard_primary_brand();

create trigger brands_require_logo_purpose
  before insert or update of logo_file_id on catalog.brands
  for each row
  execute function private.require_file_purpose('logo_file_id', 'brand_logo');

create trigger brands_set_updated_at
  before update on catalog.brands
  for each row
  execute function private.set_updated_at();

create trigger categories_set_updated_at
  before update on catalog.categories
  for each row
  execute function private.set_updated_at();

create trigger product_variants_record_price_on_insert
  after insert on catalog.product_variants
  for each row
  execute function private.record_variant_price();

create trigger product_variants_record_price_on_update
  after update of price on catalog.product_variants
  for each row
  when (((old.price)::integer IS DISTINCT FROM (new.price)::integer))
  execute function private.record_variant_price();

create trigger product_variants_set_updated_at
  before update on catalog.product_variants
  for each row
  execute function private.set_updated_at();

create trigger products_require_image_purpose
  before insert or update of image_file_id on catalog.products
  for each row
  execute function private.require_file_purpose('image_file_id', 'product_image');

create trigger products_set_updated_at
  before update on catalog.products
  for each row
  execute function private.set_updated_at();

create policy "brands_insert_for_managers" on "catalog"."brands"
  for insert
  to "authenticated"
  with
    check
    ((( SELECT private.has_permission('catalog.manage'::access.permission) AS has_permission) AND
    (created_by = ( SELECT auth.uid() AS uid)) AND (updated_by = ( SELECT auth.uid() AS uid))));

create policy "brands_select_active" on "catalog"."brands"
  for select
  to "anon", "authenticated"
  using ((archived_at is null));

create policy "brands_select_for_managers" on "catalog"."brands"
  for select
  to "authenticated"
  using (( select private.has_permission('catalog.manage'::access.permission) as has_permission));

create policy "brands_update_for_managers" on "catalog"."brands"
  for update
  to "authenticated"
  using (( select private.has_permission('catalog.manage'::access.permission) as has_permission))
  with
    check
    ((( SELECT private.has_permission('catalog.manage'::access.permission) AS has_permission) AND
    (updated_by = ( SELECT auth.uid() AS uid))));

create policy "categories_insert_for_managers" on "catalog"."categories"
  for insert
  to "authenticated"
  with
    check
    ((( SELECT private.has_permission('catalog.manage'::access.permission) AS has_permission) AND
    (created_by = ( SELECT auth.uid() AS uid)) AND (updated_by = ( SELECT auth.uid() AS uid))));

create policy "categories_select_active" on "catalog"."categories"
  for select
  to "anon", "authenticated"
  using ((archived_at is null));

create policy "categories_select_for_managers" on "catalog"."categories"
  for select
  to "authenticated"
  using (( select private.has_permission('catalog.manage'::access.permission) as has_permission));

create policy "categories_update_for_managers" on "catalog"."categories"
  for update
  to "authenticated"
  using (( select private.has_permission('catalog.manage'::access.permission) as has_permission))
  with
    check
    ((( SELECT private.has_permission('catalog.manage'::access.permission) AS has_permission) AND
    (updated_by = ( SELECT auth.uid() AS uid))));

create policy "product_categories_delete_for_managers" on "catalog"."product_categories"
  for delete
  to "authenticated"
  using (( select private.has_permission('catalog.manage'::access.permission) as has_permission));

create policy "product_categories_insert_for_managers" on "catalog"."product_categories"
  for insert
  to "authenticated"
  with
    check
    ((( SELECT private.has_permission('catalog.manage'::access.permission) AS has_permission) AND
    (created_by = ( SELECT auth.uid() AS uid))));

create policy "product_categories_select_for_managers" on "catalog"."product_categories"
  for select
  to "authenticated"
  using (( select private.has_permission('catalog.manage'::access.permission) as has_permission));

create policy "product_variants_insert_for_managers" on "catalog"."product_variants"
  for insert
  to "authenticated"
  with
    check
    ((( SELECT private.has_permission('catalog.manage'::access.permission) AS has_permission) AND
    (created_by = ( SELECT auth.uid() AS uid)) AND (updated_by = ( SELECT auth.uid() AS uid))));

create policy "product_variants_select_active" on "catalog"."product_variants"
  for select
  to "anon", "authenticated"
  using ((archived_at is null));

create policy "product_variants_select_for_managers" on "catalog"."product_variants"
  for select
  to "authenticated"
  using (( select private.has_permission('catalog.manage'::access.permission) as has_permission));

create policy "product_variants_update_for_managers" on "catalog"."product_variants"
  for update
  to "authenticated"
  using (( select private.has_permission('catalog.manage'::access.permission) as has_permission))
  with
    check
    ((( SELECT private.has_permission('catalog.manage'::access.permission) AS has_permission) AND
    (updated_by = ( SELECT auth.uid() AS uid))));

create policy "products_insert_for_managers" on "catalog"."products"
  for insert
  to "authenticated"
  with
    check
    ((( SELECT private.has_permission('catalog.manage'::access.permission) AS has_permission) AND
    (created_by = ( SELECT auth.uid() AS uid)) AND (updated_by = ( SELECT auth.uid() AS uid))));

create policy "products_select_active" on "catalog"."products"
  for select
  to "anon", "authenticated"
  using ((archived_at is null));

create policy "products_select_for_managers" on "catalog"."products"
  for select
  to "authenticated"
  using (( select private.has_permission('catalog.manage'::access.permission) as has_permission));

create policy "products_update_for_managers" on "catalog"."products"
  for update
  to "authenticated"
  using (( select private.has_permission('catalog.manage'::access.permission) as has_permission))
  with
    check
    ((( SELECT private.has_permission('catalog.manage'::access.permission) AS has_permission) AND
    (updated_by = ( SELECT auth.uid() AS uid))));

create policy "variant_price_history_select_for_managers" on "catalog"."variant_price_history"
  for select
  to "authenticated"
  using (( select private.has_permission('catalog.manage'::access.permission) as has_permission));

revoke all on function "catalog"."set_default_variant"(uuid) from public;

grant execute on function "catalog"."set_default_variant"(uuid) to "authenticated";

revoke all on function "catalog"."set_primary_brand"(uuid) from public;

grant execute on function "catalog"."set_primary_brand"(uuid) to "authenticated";

revoke all on function "catalog"."set_product_categories"(uuid, uuid[]) from public;

grant execute on function "catalog"."set_product_categories"(uuid, uuid[]) to "authenticated";

revoke all on function "private"."guard_primary_brand"() from public;

revoke all on function "private"."record_variant_price"() from public;

revoke all on function "private"."require_file_purpose"() from public;

grant usage on schema "catalog" to "anon", "authenticated", "service_role";

grant select on table "catalog"."brands" to "anon";

grant insert, select, update on table "catalog"."brands" to "authenticated", "service_role";

grant select on table "catalog"."categories" to "anon";

grant insert, select, update on table "catalog"."categories" to "authenticated", "service_role";

grant select on table "catalog"."product_categories" to "anon";

grant delete, insert, select
  on table "catalog"."product_categories"
  to "authenticated", "service_role";

grant select on table "catalog"."product_variants" to "anon";

grant insert, select, update
  on table "catalog"."product_variants"
  to "authenticated", "service_role";

grant select on table "catalog"."products" to "anon";

grant insert, select, update on table "catalog"."products" to "authenticated", "service_role";

grant select on table "catalog"."variant_price_history" to "authenticated", "service_role";

alter table "catalog"."products"
  add constraint "products_brand_id_fkey" foreign key (brand_id) references catalog.brands(id);

alter table "catalog"."product_categories"
  add constraint "product_categories_category_id_fkey" foreign key (category_id)
    references catalog.categories(id);

alter table "catalog"."variant_price_history"
  add constraint "variant_price_history_variant_id_fkey" foreign key (variant_id)
    references catalog.product_variants(id);

alter table "catalog"."product_categories"
  add constraint "product_categories_product_id_fkey" foreign key (product_id)
    references catalog.products(id);

alter table "catalog"."product_variants"
  add constraint "product_variants_product_id_fkey" foreign key (product_id)
    references catalog.products(id);

create policy "product_categories_select_active" on "catalog"."product_categories"
  for select
  to "anon", "authenticated"
  using (((exists ( select 1
   from catalog.products products
  where ((products.id = product_categories.product_id) AND (products.archived_at is null)))) AND
    (exists ( select 1
   from catalog.categories categories
  where ((categories.id = product_categories.category_id) AND (categories.archived_at is null))))));
