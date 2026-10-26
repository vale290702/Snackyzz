-- Places Snackyzz runs where customers collect online orders. Third-party stores are retail.
create table fulfillment.pickup_locations (
  id uuid not null default private.uuid_v7(),
  name text not null,
  address text not null,
  city text not null,
  map_url text,
  instructions text,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,

  constraint pickup_locations_pkey primary key (id),

  constraint pickup_locations_created_by_fkey foreign key (created_by)
    references access.admins (user_id),

  constraint pickup_locations_updated_by_fkey foreign key (updated_by)
    references access.admins (user_id),

  constraint pickup_locations_name_check check (
    char_length(name) between 1 and 120
  ),

  constraint pickup_locations_address_check check (
    char_length(address) between 1 and 300
  ),

  constraint pickup_locations_city_check check (
    char_length(city) between 1 and 80
  ),

  constraint pickup_locations_map_url_check check (
    char_length(map_url) between 1 and 500
    and map_url ~ '^https://'
  ),

  constraint pickup_locations_instructions_check check (
    char_length(instructions) between 1 and 500
  ),

  constraint pickup_locations_sort_order_check check (
    sort_order >= 0
  )
);

create index pickup_locations_created_by_idx on fulfillment.pickup_locations (created_by);

create index pickup_locations_updated_by_idx on fulfillment.pickup_locations (updated_by);

create trigger pickup_locations_set_updated_at
before update on fulfillment.pickup_locations
for each row
execute function private.set_updated_at();
