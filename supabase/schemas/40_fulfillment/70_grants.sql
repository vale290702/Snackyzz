-- Writes go through RLS (fulfillment.manage). Hour rows are replaced as a set, so they get insert
-- and delete; the settings singleton is only updated.
revoke all on table fulfillment.pickup_locations from public, anon, authenticated, service_role;

revoke all on table fulfillment.pickup_location_hours from public, anon, authenticated, service_role;

revoke all on table fulfillment.delivery_zones from public, anon, authenticated, service_role;

revoke all on table fulfillment.delivery_hours from public, anon, authenticated, service_role;

revoke all on table fulfillment.settings from public, anon, authenticated, service_role;

grant select on table fulfillment.pickup_locations to anon;

grant select on table fulfillment.pickup_location_hours to anon;

grant select on table fulfillment.delivery_zones to anon;

grant select on table fulfillment.delivery_hours to anon;

grant select on table fulfillment.settings to anon;

grant select, insert, update on table fulfillment.pickup_locations to authenticated, service_role;

grant select, insert, delete on table fulfillment.pickup_location_hours to authenticated, service_role;

grant select, insert, update on table fulfillment.delivery_zones to authenticated, service_role;

grant select, insert, delete on table fulfillment.delivery_hours to authenticated, service_role;

grant select, update on table fulfillment.settings to authenticated, service_role;
