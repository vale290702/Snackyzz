-- Areas we deliver to, each with a flat fee in whole colones.
create table fulfillment.delivery_zones (
  id uuid not null default private.uuid_v7(),
  name text not null,
  fee public.amount_crc not null,
  sort_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid,

  constraint delivery_zones_pkey primary key (id),

  constraint delivery_zones_created_by_fkey foreign key (created_by)
    references access.admins (user_id),

  constraint delivery_zones_updated_by_fkey foreign key (updated_by)
    references access.admins (user_id),

  constraint delivery_zones_name_check check (
    char_length(name) between 1 and 100
  ),

  constraint delivery_zones_sort_order_check check (
    sort_order >= 0
  )
);

-- Customers pick a zone by name, so two active zones can't share one.
create unique index delivery_zones_name_key on fulfillment.delivery_zones (lower(name))
where archived_at is null;

create index delivery_zones_created_by_idx on fulfillment.delivery_zones (created_by);

create index delivery_zones_updated_by_idx on fulfillment.delivery_zones (updated_by);

create trigger delivery_zones_set_updated_at
before update on fulfillment.delivery_zones
for each row
execute function private.set_updated_at();
