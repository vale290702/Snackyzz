-- Snackyzz pickup locations, delivery zones, hours and settings (features/fulfillment). Exposed
-- through the Data API with RLS.
create schema if not exists fulfillment;

revoke all on schema fulfillment from public;

grant usage on schema fulfillment to anon, authenticated, service_role;
