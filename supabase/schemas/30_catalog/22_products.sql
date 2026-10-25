create table catalog.products (
  id uuid not null default private.uuid_v7(),
  brand_id uuid not null,
  slug text not null,
  name text not null,
  description text not null,
  badge text,
  accent_color text not null,
  image_file_id uuid,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,

  constraint products_pkey primary key (id),

  -- Also serves as the brand_id index: brand_id leads it.
  constraint products_brand_id_slug_key unique (brand_id, slug),

  constraint products_brand_id_fkey foreign key (brand_id)
    references catalog.brands (id),

  constraint products_image_file_id_fkey foreign key (image_file_id)
    references media.files (id),

  constraint products_created_by_fkey foreign key (created_by)
    references access.admins (user_id),

  constraint products_updated_by_fkey foreign key (updated_by)
    references access.admins (user_id),

  constraint products_slug_check check (
    char_length(slug) between 1 and 60
    and slug ~ '^[a-z0-9-]+$'
  ),

  constraint products_name_check check (
    char_length(name) between 1 and 120
  ),

  constraint products_description_check check (
    char_length(description) between 1 and 1000
  ),

  constraint products_badge_check check (
    char_length(badge) between 1 and 30
  ),

  constraint products_accent_color_check check (
    accent_color ~ '^#[0-9A-Fa-f]{6}$'
  ),

  constraint products_sort_order_check check (
    sort_order >= 0
  )
);

create index products_image_file_id_idx on catalog.products (image_file_id);

create index products_created_by_idx on catalog.products (created_by);

create index products_updated_by_idx on catalog.products (updated_by);

create trigger products_set_updated_at
before update on catalog.products
for each row
execute function private.set_updated_at();
