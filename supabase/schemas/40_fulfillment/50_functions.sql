-- Entry point: replaces a pickup location's weekly hours in one transaction. Runs as the caller, so
-- RLS requires fulfillment.manage. Each range is {"weekday": 1-7, "opens_at": "HH:MM",
-- "closes_at": "HH:MM"}; the table's checks and exclusion constraint refuse inverted or
-- overlapping ranges.
create or replace function fulfillment.set_pickup_location_hours(
  p_pickup_location_id uuid,
  p_hours jsonb
)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not (select private.has_permission('fulfillment.manage')) then
    raise exception using
      errcode = '42501',
      message = 'permission denied for fulfillment.set_pickup_location_hours';
  end if;

  -- Locking the location makes concurrent replacements apply one after the other.
  perform 1
  from fulfillment.pickup_locations as locations
  where locations.id = p_pickup_location_id
    and locations.archived_at is null
  for update;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'pickup_location_not_found';
  end if;

  delete from fulfillment.pickup_location_hours as hours
  where hours.pickup_location_id = p_pickup_location_id;

  insert into fulfillment.pickup_location_hours (
    pickup_location_id,
    weekday,
    opens_at,
    closes_at,
    created_by
  )
  select
    p_pickup_location_id,
    ranges.weekday,
    ranges.opens_at,
    ranges.closes_at,
    (select auth.uid())
  from jsonb_to_recordset(p_hours) as ranges (
    weekday smallint,
    opens_at time,
    closes_at time
  );
end;
$$;

revoke execute on function fulfillment.set_pickup_location_hours(uuid, jsonb) from public, anon, authenticated, service_role;

grant execute on function fulfillment.set_pickup_location_hours(uuid, jsonb) to authenticated;

-- Entry point: replaces the weekly delivery hours in one transaction. Runs as the caller (RLS).
-- Ranges have the same shape as for fulfillment.set_pickup_location_hours.
create or replace function fulfillment.set_delivery_hours(p_hours jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not (select private.has_permission('fulfillment.manage')) then
    raise exception using
      errcode = '42501',
      message = 'permission denied for fulfillment.set_delivery_hours';
  end if;

  -- Locking the settings singleton makes concurrent replacements apply one after the other.
  perform 1
  from fulfillment.settings as settings
  where settings.id
  for update;

  -- API requests load pg_safeupdate, which refuses a delete without a where clause.
  delete from fulfillment.delivery_hours as hours
  where hours.id is not null;

  insert into fulfillment.delivery_hours (
    weekday,
    opens_at,
    closes_at,
    created_by
  )
  select
    ranges.weekday,
    ranges.opens_at,
    ranges.closes_at,
    (select auth.uid())
  from jsonb_to_recordset(p_hours) as ranges (
    weekday smallint,
    opens_at time,
    closes_at time
  );
end;
$$;

revoke execute on function fulfillment.set_delivery_hours(jsonb) from public, anon, authenticated, service_role;

grant execute on function fulfillment.set_delivery_hours(jsonb) to authenticated;
