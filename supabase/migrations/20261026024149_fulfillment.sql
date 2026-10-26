set local check_function_bodies = off;

create schema "fulfillment";

create extension "btree_gist" schema "extensions";

create table "fulfillment"."delivery_hours" (
  "weekday"    smallint                 not null,
  "opens_at"   time without time zone   not null,
  "closes_at"  time without time zone   not null,
  "created_at" timestamp with time zone not null default now(),
  "created_by" uuid,
  constraint "delivery_hours_range_check" check ((closes_at > opens_at)),
  constraint "delivery_hours_weekday_check" check (((weekday >= 1) AND (weekday <= 7))),
  constraint "delivery_hours_whole_minutes_check"
    check
    (((EXTRACT(second FROM opens_at) = (0)::numeric) AND (EXTRACT(second FROM closes_at) =
    (0)::numeric))),
  "id"         uuid                     not null default private.uuid_v7(),
  constraint "delivery_hours_pkey" primary key (id)
);

alter table "fulfillment"."delivery_hours"
  enable row level security;

create table "fulfillment"."delivery_zones" (
  "name"        text                     not null,
  "fee"         public.amount_crc        not null,
  "sort_order"  integer                  not null default 0,
  "archived_at" timestamp with time zone,
  "created_at"  timestamp with time zone not null default now(),
  "updated_at"  timestamp with time zone not null default now(),
  "created_by"  uuid,
  "updated_by"  uuid,
  constraint "delivery_zones_name_check"
    check (((char_length(name) >= 1) AND (char_length(name) <= 100))),
  constraint "delivery_zones_sort_order_check" check ((sort_order >= 0)),
  "id"          uuid                     not null default private.uuid_v7(),
  constraint "delivery_zones_pkey" primary key (id)
);

alter table "fulfillment"."delivery_zones"
  enable row level security;

create table "fulfillment"."pickup_location_hours" (
  "pickup_location_id" uuid                     not null,
  "weekday"            smallint                 not null,
  "opens_at"           time without time zone   not null,
  "closes_at"          time without time zone   not null,
  "created_at"         timestamp with time zone not null default now(),
  "created_by"         uuid,
  constraint "pickup_location_hours_range_check" check ((closes_at > opens_at)),
  constraint "pickup_location_hours_weekday_check" check (((weekday >= 1) AND (weekday <= 7))),
  constraint "pickup_location_hours_whole_minutes_check"
    check
    (((EXTRACT(second FROM opens_at) = (0)::numeric) AND (EXTRACT(second FROM closes_at) =
    (0)::numeric))),
  "id"                 uuid                     not null default private.uuid_v7(),
  constraint "pickup_location_hours_pkey" primary key (id)
);

alter table "fulfillment"."pickup_location_hours"
  enable row level security;

create table "fulfillment"."pickup_locations" (
  "name"         text                     not null,
  "address"      text                     not null,
  "city"         text                     not null,
  "map_url"      text,
  "instructions" text,
  "sort_order"   integer                  not null default 0,
  "archived_at"  timestamp with time zone,
  "created_at"   timestamp with time zone not null default now(),
  "updated_at"   timestamp with time zone not null default now(),
  "created_by"   uuid,
  "updated_by"   uuid,
  constraint "pickup_locations_address_check"
    check (((char_length(address) >= 1) AND (char_length(address) <= 300))),
  constraint "pickup_locations_city_check"
    check (((char_length(city) >= 1) AND (char_length(city) <= 80))),
  constraint "pickup_locations_instructions_check"
    check (((char_length(instructions) >= 1) AND (char_length(instructions) <= 500))),
  constraint "pickup_locations_map_url_check"
    check
    ((((char_length(map_url) >= 1) AND (char_length(map_url) <= 500)) AND (map_url ~
    '^https://'::text))),
  constraint "pickup_locations_name_check"
    check (((char_length(name) >= 1) AND (char_length(name) <= 120))),
  constraint "pickup_locations_sort_order_check" check ((sort_order >= 0)),
  "id"           uuid                     not null default private.uuid_v7(),
  constraint "pickup_locations_pkey" primary key (id)
);

alter table "fulfillment"."pickup_locations"
  enable row level security;

create table "fulfillment"."settings" (
  "id"                  boolean                  not null default true,
  "is_pickup_enabled"   boolean                  not null default true,
  "is_delivery_enabled" boolean                  not null default true,
  "delivery_lead_hours" integer                  not null default 6,
  "delivery_slot_hours" integer                  not null default 3,
  "timezone"            text                     not null default 'America/Costa_Rica'::text,
  "created_at"          timestamp with time zone not null default now(),
  "updated_at"          timestamp with time zone not null default now(),
  "updated_by"          uuid,
  constraint "settings_delivery_lead_hours_check"
    check (((delivery_lead_hours >= 0) AND (delivery_lead_hours <= 168))),
  constraint "settings_delivery_slot_hours_check"
    check (((delivery_slot_hours >= 1) AND (delivery_slot_hours <= 12))),
  constraint "settings_id_check" check (id),
  constraint "settings_pkey" primary key (id),
  constraint "settings_timezone_check"
    check (((char_length(timezone) >= 1) AND (char_length(timezone) <= 64)))
);

alter table "fulfillment"."settings"
  enable row level security;

create type "fulfillment"."time_range" as range (
  subtype              = time without time zone,
  MULTIRANGE_TYPE_NAME = fulfillment.time_multirange
);

create or replace function fulfillment.set_delivery_hours (
  p_hours jsonb
)
  returns void
  language plpgsql
  set search_path to ''
  AS $function$
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
$function$;

create or replace function fulfillment.set_pickup_location_hours (
  p_pickup_location_id uuid,
  p_hours              jsonb
)
  returns void
  language plpgsql
  set search_path to ''
  AS $function$
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
$function$;

alter table "fulfillment"."delivery_hours"
  add constraint "delivery_hours_created_by_fkey" foreign key (created_by)
    references access.admins(user_id);

alter table "fulfillment"."delivery_hours"
  add constraint "delivery_hours_overlap_excl" EXCLUDE using gist (weekday
    with =, fulfillment.time_range(opens_at, closes_at) with &&);

alter table "fulfillment"."delivery_zones"
  add constraint "delivery_zones_created_by_fkey" foreign key (created_by)
    references access.admins(user_id);

alter table "fulfillment"."delivery_zones"
  add constraint "delivery_zones_updated_by_fkey" foreign key (updated_by)
    references access.admins(user_id);

alter table "fulfillment"."pickup_location_hours"
  add constraint "pickup_location_hours_created_by_fkey" foreign key (created_by)
    references access.admins(user_id);

alter table "fulfillment"."pickup_location_hours"
  add constraint "pickup_location_hours_overlap_excl" EXCLUDE using gist (pickup_location_id
    with =, weekday with =, fulfillment.time_range(opens_at, closes_at) with &&);

alter table "fulfillment"."pickup_locations"
  add constraint "pickup_locations_created_by_fkey" foreign key (created_by)
    references access.admins(user_id);

alter table "fulfillment"."pickup_locations"
  add constraint "pickup_locations_updated_by_fkey" foreign key (updated_by)
    references access.admins(user_id);

alter table "fulfillment"."settings"
  add constraint "settings_updated_by_fkey" foreign key (updated_by)
    references access.admins(user_id);

create index delivery_hours_created_by_idx on fulfillment.delivery_hours using btree (created_by);

create index delivery_zones_created_by_idx on fulfillment.delivery_zones using btree (created_by);

create unique index delivery_zones_name_key on fulfillment.delivery_zones using btree (lower(name))
  where (archived_at is null);

create index delivery_zones_updated_by_idx on fulfillment.delivery_zones using btree (updated_by);

create index pickup_location_hours_created_by_idx on fulfillment.pickup_location_hours
  using btree (created_by);

create index pickup_location_hours_pickup_location_id_idx on fulfillment.pickup_location_hours
  using btree (pickup_location_id);

create index pickup_locations_created_by_idx on fulfillment.pickup_locations
  using btree (created_by);

create index pickup_locations_updated_by_idx on fulfillment.pickup_locations
  using btree (updated_by);

create index settings_updated_by_idx on fulfillment.settings using btree (updated_by);

create trigger delivery_zones_set_updated_at
  before update on fulfillment.delivery_zones
  for each row
  execute function private.set_updated_at();

create trigger pickup_locations_set_updated_at
  before update on fulfillment.pickup_locations
  for each row
  execute function private.set_updated_at();

create trigger settings_set_updated_at
  before update on fulfillment.settings
  for each row
  execute function private.set_updated_at();

create policy "delivery_hours_delete_for_managers" on "fulfillment"."delivery_hours"
  for delete
  to "authenticated"
  using
    (( select private.has_permission('fulfillment.manage'::access.permission) as has_permission));

create policy "delivery_hours_insert_for_managers" on "fulfillment"."delivery_hours"
  for insert
  to "authenticated"
  with
    check
    ((( SELECT private.has_permission('fulfillment.manage'::access.permission) AS has_permission)
    AND (created_by = ( SELECT auth.uid() AS uid))));

create policy "delivery_hours_select_all" on "fulfillment"."delivery_hours"
  for select
  to "anon", "authenticated"
  using (true);

create policy "delivery_zones_insert_for_managers" on "fulfillment"."delivery_zones"
  for insert
  to "authenticated"
  with
    check
    ((( SELECT private.has_permission('fulfillment.manage'::access.permission) AS has_permission)
    AND (created_by = ( SELECT auth.uid() AS uid)) AND (updated_by = ( SELECT auth.uid() AS uid))));

create policy "delivery_zones_select_active" on "fulfillment"."delivery_zones"
  for select
  to "anon", "authenticated"
  using ((archived_at is null));

create policy "delivery_zones_select_for_managers" on "fulfillment"."delivery_zones"
  for select
  to "authenticated"
  using
    (( select private.has_permission('fulfillment.manage'::access.permission) as has_permission));

create policy "delivery_zones_update_for_managers" on "fulfillment"."delivery_zones"
  for update
  to "authenticated"
  using
    (( select private.has_permission('fulfillment.manage'::access.permission) as has_permission))
  with
    check
    ((( SELECT private.has_permission('fulfillment.manage'::access.permission) AS has_permission)
    AND (updated_by = ( SELECT auth.uid() AS uid))));

create policy "pickup_location_hours_delete_for_managers" on "fulfillment"."pickup_location_hours"
  for delete
  to "authenticated"
  using
    (( select private.has_permission('fulfillment.manage'::access.permission) as has_permission));

create policy "pickup_location_hours_insert_for_managers" on "fulfillment"."pickup_location_hours"
  for insert
  to "authenticated"
  with
    check
    ((( SELECT private.has_permission('fulfillment.manage'::access.permission) AS has_permission)
    AND (created_by = ( SELECT auth.uid() AS uid))));

create policy "pickup_location_hours_select_for_managers" on "fulfillment"."pickup_location_hours"
  for select
  to "authenticated"
  using
    (( select private.has_permission('fulfillment.manage'::access.permission) as has_permission));

create policy "pickup_locations_insert_for_managers" on "fulfillment"."pickup_locations"
  for insert
  to "authenticated"
  with
    check
    ((( SELECT private.has_permission('fulfillment.manage'::access.permission) AS has_permission)
    AND (created_by = ( SELECT auth.uid() AS uid)) AND (updated_by = ( SELECT auth.uid() AS uid))));

create policy "pickup_locations_select_active" on "fulfillment"."pickup_locations"
  for select
  to "anon", "authenticated"
  using ((archived_at is null));

create policy "pickup_locations_select_for_managers" on "fulfillment"."pickup_locations"
  for select
  to "authenticated"
  using
    (( select private.has_permission('fulfillment.manage'::access.permission) as has_permission));

create policy "pickup_locations_update_for_managers" on "fulfillment"."pickup_locations"
  for update
  to "authenticated"
  using
    (( select private.has_permission('fulfillment.manage'::access.permission) as has_permission))
  with
    check
    ((( SELECT private.has_permission('fulfillment.manage'::access.permission) AS has_permission)
    AND (updated_by = ( SELECT auth.uid() AS uid))));

create policy "settings_select_all" on "fulfillment"."settings"
  for select
  to "anon", "authenticated"
  using (true);

create policy "settings_update_for_managers" on "fulfillment"."settings"
  for update
  to "authenticated"
  using
    (( select private.has_permission('fulfillment.manage'::access.permission) as has_permission))
  with
    check
    ((( SELECT private.has_permission('fulfillment.manage'::access.permission) AS has_permission)
    AND (updated_by = ( SELECT auth.uid() AS uid))));

comment on extension "btree_gist" is 'support for indexing common datatypes in GiST';

revoke all on function "fulfillment"."set_delivery_hours"(jsonb) from public;

grant execute on function "fulfillment"."set_delivery_hours"(jsonb) to "authenticated";

revoke all on function "fulfillment"."set_pickup_location_hours"(uuid, jsonb) from public;

grant execute on function "fulfillment"."set_pickup_location_hours"(uuid, jsonb) to "authenticated";

grant usage on schema "fulfillment" to "anon", "authenticated", "service_role";

grant select on table "fulfillment"."delivery_hours" to "anon";

grant delete, insert, select
  on table "fulfillment"."delivery_hours"
  to "authenticated", "service_role";

grant select on table "fulfillment"."delivery_zones" to "anon";

grant insert, select, update
  on table "fulfillment"."delivery_zones"
  to "authenticated", "service_role";

grant select on table "fulfillment"."pickup_location_hours" to "anon";

grant delete, insert, select
  on table "fulfillment"."pickup_location_hours"
  to "authenticated", "service_role";

grant select on table "fulfillment"."pickup_locations" to "anon";

grant insert, select, update
  on table "fulfillment"."pickup_locations"
  to "authenticated", "service_role";

grant select on table "fulfillment"."settings" to "anon";

grant select, update on table "fulfillment"."settings" to "authenticated", "service_role";

alter table "fulfillment"."pickup_location_hours"
  add constraint "pickup_location_hours_pickup_location_id_fkey" foreign key (pickup_location_id)
    references fulfillment.pickup_locations(id);

create policy "pickup_location_hours_select_active" on "fulfillment"."pickup_location_hours"
  for select
  to "anon", "authenticated"
  using ((exists ( select 1
   from fulfillment.pickup_locations locations
  where
    ((locations.id = pickup_location_hours.pickup_location_id) AND (locations.archived_at is
    null)))));
