create table inventory.stock_levels (
  id uuid not null default private.uuid_v7(),
  variant_id uuid not null,
  pickup_location_id uuid,
  is_global boolean generated always as (pickup_location_id is null) stored,
  quantity_available integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint stock_levels_pkey primary key (id),
  constraint stock_levels_variant_id_pickup_location_id_key
    unique nulls not distinct (variant_id, pickup_location_id),
  constraint stock_levels_variant_id_fkey foreign key (variant_id)
    references catalog.product_variants (id),
  constraint stock_levels_pickup_location_id_fkey foreign key (pickup_location_id)
    references fulfillment.pickup_locations (id),
  constraint stock_levels_quantity_available_check check (quantity_available >= 0)
);

create index stock_levels_pickup_location_id_idx on inventory.stock_levels (pickup_location_id);

create trigger stock_levels_set_updated_at
before update on inventory.stock_levels
for each row
execute function private.set_updated_at();
