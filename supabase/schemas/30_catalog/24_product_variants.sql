-- What carts, orders and stock reference. A product with one variant renders as a simple product.
create table catalog.product_variants (
  id uuid not null default private.uuid_v7(),
  product_id uuid not null,
  sku text,
  name text not null,
  price public.amount_crc not null,
  is_default boolean not null default false,
  is_stock_tracked boolean not null default true,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,

  constraint product_variants_pkey primary key (id),

  constraint product_variants_sku_key unique (sku),

  constraint product_variants_product_id_fkey foreign key (product_id)
    references catalog.products (id),

  constraint product_variants_created_by_fkey foreign key (created_by)
    references access.admins (user_id),

  constraint product_variants_updated_by_fkey foreign key (updated_by)
    references access.admins (user_id),

  constraint product_variants_sku_check check (
    char_length(sku) between 1 and 40
  ),

  constraint product_variants_name_check check (
    char_length(name) between 1 and 60
  ),

  constraint product_variants_price_check check (
    price > 0
  ),

  constraint product_variants_sort_order_check check (
    sort_order >= 0
  ),

  -- Another variant must become the default before this one is archived.
  constraint product_variants_default_not_archived_check check (
    not (is_default and archived_at is not null)
  )
);

create index product_variants_product_id_idx on catalog.product_variants (product_id);

-- One default variant per product.
create unique index product_variants_product_id_is_default_key on catalog.product_variants (product_id)
where is_default;

create index product_variants_created_by_idx on catalog.product_variants (created_by);

create index product_variants_updated_by_idx on catalog.product_variants (updated_by);

create trigger product_variants_set_updated_at
before update on catalog.product_variants
for each row
execute function private.set_updated_at();
