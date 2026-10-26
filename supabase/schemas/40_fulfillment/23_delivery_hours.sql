-- When deliveries can arrive; delivery windows are cut from these ranges. A weekday without rows
-- is closed. Rows are replaced as a set through fulfillment.set_delivery_hours, so they carry
-- created_* only.
create table fulfillment.delivery_hours (
  id uuid not null default private.uuid_v7(),
  weekday smallint not null,
  opens_at time not null,
  closes_at time not null,
  created_at timestamptz not null default now(),
  created_by uuid,

  constraint delivery_hours_pkey primary key (id),

  constraint delivery_hours_created_by_fkey foreign key (created_by)
    references access.admins (user_id),

  -- ISO weekdays: 1 = Monday … 7 = Sunday.
  constraint delivery_hours_weekday_check check (
    weekday between 1 and 7
  ),

  constraint delivery_hours_range_check check (
    closes_at > opens_at
  ),

  constraint delivery_hours_whole_minutes_check check (
    extract(second from opens_at) = 0
    and extract(second from closes_at) = 0
  ),

  constraint delivery_hours_overlap_excl exclude using gist (
    weekday with =,
    fulfillment.time_range(opens_at, closes_at) with &&
  )
);

create index delivery_hours_created_by_idx on fulfillment.delivery_hours (created_by);
