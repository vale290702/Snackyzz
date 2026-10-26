-- When a pickup location is open. A weekday without rows is closed. Rows are replaced as a set
-- through fulfillment.set_pickup_location_hours, never edited, so they carry created_* only.
create table fulfillment.pickup_location_hours (
  id uuid not null default private.uuid_v7(),
  pickup_location_id uuid not null,
  weekday smallint not null,
  opens_at time not null,
  closes_at time not null,
  created_at timestamptz not null default now(),
  created_by uuid,

  constraint pickup_location_hours_pkey primary key (id),

  constraint pickup_location_hours_pickup_location_id_fkey foreign key (pickup_location_id)
    references fulfillment.pickup_locations (id),

  constraint pickup_location_hours_created_by_fkey foreign key (created_by)
    references access.admins (user_id),

  -- ISO weekdays: 1 = Monday … 7 = Sunday.
  constraint pickup_location_hours_weekday_check check (
    weekday between 1 and 7
  ),

  constraint pickup_location_hours_range_check check (
    closes_at > opens_at
  ),

  constraint pickup_location_hours_whole_minutes_check check (
    extract(second from opens_at) = 0
    and extract(second from closes_at) = 0
  ),

  constraint pickup_location_hours_overlap_excl exclude using gist (
    pickup_location_id with =,
    weekday with =,
    fulfillment.time_range(opens_at, closes_at) with &&
  )
);

create index pickup_location_hours_pickup_location_id_idx on fulfillment.pickup_location_hours (pickup_location_id);

create index pickup_location_hours_created_by_idx on fulfillment.pickup_location_hours (created_by);
