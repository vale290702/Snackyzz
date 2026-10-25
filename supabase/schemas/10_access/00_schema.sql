-- Admins, roles and the permission map (features/access). Exposed through the Data API with RLS.
create schema if not exists access;

revoke all on schema access from public;

grant usage on schema access to authenticated, service_role;
