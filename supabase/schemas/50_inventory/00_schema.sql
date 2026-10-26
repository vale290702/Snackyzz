create schema if not exists inventory;

revoke all on schema inventory from public;

grant usage on schema inventory to anon, authenticated, service_role;
