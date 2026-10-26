-- Singleton: which fulfillment methods checkout offers and how delivery windows are cut. The row
-- is created by the fulfillment data migration and only ever updated, so it has no created_by.
create table fulfillment.settings (
  id boolean not null default true,
  is_pickup_enabled boolean not null default true,
  is_delivery_enabled boolean not null default true,
  delivery_lead_hours integer not null default 6,
  delivery_slot_hours integer not null default 3,
  timezone text not null default 'America/Costa_Rica',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid,

  constraint settings_pkey primary key (id),

  constraint settings_updated_by_fkey foreign key (updated_by)
    references access.admins (user_id),

  constraint settings_id_check check (
    id
  ),

  constraint settings_delivery_lead_hours_check check (
    delivery_lead_hours between 0 and 168
  ),

  constraint settings_delivery_slot_hours_check check (
    delivery_slot_hours between 1 and 12
  ),

  constraint settings_timezone_check check (
    char_length(timezone) between 1 and 64
  )
);

create index settings_updated_by_idx on fulfillment.settings (updated_by);

create trigger settings_set_updated_at
before update on fulfillment.settings
for each row
execute function private.set_updated_at();
