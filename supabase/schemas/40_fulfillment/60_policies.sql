-- Shoppers read active rows and every hour row of an active location; fulfillment managers read
-- everything and write with their own id in the audit columns. Locations and zones are archived,
-- never deleted (DB-07); hour rows are replaced as a set, so they are inserted and deleted.
alter table fulfillment.pickup_locations enable row level security;

create policy pickup_locations_select_active
on fulfillment.pickup_locations
for select
to anon, authenticated
using (archived_at is null);

create policy pickup_locations_select_for_managers
on fulfillment.pickup_locations
for select
to authenticated
using ((select private.has_permission('fulfillment.manage')));

create policy pickup_locations_insert_for_managers
on fulfillment.pickup_locations
for insert
to authenticated
with check (
  (select private.has_permission('fulfillment.manage'))
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
);

create policy pickup_locations_update_for_managers
on fulfillment.pickup_locations
for update
to authenticated
using ((select private.has_permission('fulfillment.manage')))
with check (
  (select private.has_permission('fulfillment.manage'))
  and updated_by = (select auth.uid())
);

alter table fulfillment.pickup_location_hours enable row level security;

create policy pickup_location_hours_select_active
on fulfillment.pickup_location_hours
for select
to anon, authenticated
using (
  exists (
    select 1
    from fulfillment.pickup_locations as locations
    where locations.id = pickup_location_id
      and locations.archived_at is null
  )
);

create policy pickup_location_hours_select_for_managers
on fulfillment.pickup_location_hours
for select
to authenticated
using ((select private.has_permission('fulfillment.manage')));

create policy pickup_location_hours_insert_for_managers
on fulfillment.pickup_location_hours
for insert
to authenticated
with check (
  (select private.has_permission('fulfillment.manage'))
  and created_by = (select auth.uid())
);

create policy pickup_location_hours_delete_for_managers
on fulfillment.pickup_location_hours
for delete
to authenticated
using ((select private.has_permission('fulfillment.manage')));

alter table fulfillment.delivery_zones enable row level security;

create policy delivery_zones_select_active
on fulfillment.delivery_zones
for select
to anon, authenticated
using (archived_at is null);

create policy delivery_zones_select_for_managers
on fulfillment.delivery_zones
for select
to authenticated
using ((select private.has_permission('fulfillment.manage')));

create policy delivery_zones_insert_for_managers
on fulfillment.delivery_zones
for insert
to authenticated
with check (
  (select private.has_permission('fulfillment.manage'))
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
);

create policy delivery_zones_update_for_managers
on fulfillment.delivery_zones
for update
to authenticated
using ((select private.has_permission('fulfillment.manage')))
with check (
  (select private.has_permission('fulfillment.manage'))
  and updated_by = (select auth.uid())
);

alter table fulfillment.delivery_hours enable row level security;

create policy delivery_hours_select_all
on fulfillment.delivery_hours
for select
to anon, authenticated
using (true);

create policy delivery_hours_insert_for_managers
on fulfillment.delivery_hours
for insert
to authenticated
with check (
  (select private.has_permission('fulfillment.manage'))
  and created_by = (select auth.uid())
);

create policy delivery_hours_delete_for_managers
on fulfillment.delivery_hours
for delete
to authenticated
using ((select private.has_permission('fulfillment.manage')));

alter table fulfillment.settings enable row level security;

create policy settings_select_all
on fulfillment.settings
for select
to anon, authenticated
using (true);

create policy settings_update_for_managers
on fulfillment.settings
for update
to authenticated
using ((select private.has_permission('fulfillment.manage')))
with check (
  (select private.has_permission('fulfillment.manage'))
  and updated_by = (select auth.uid())
);
