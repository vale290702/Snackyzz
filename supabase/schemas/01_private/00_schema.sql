-- Helpers shared by every feature schema. Not exposed through the Data API.
create schema if not exists private;

revoke all on schema private from public;

grant usage on schema private to authenticated, service_role;
