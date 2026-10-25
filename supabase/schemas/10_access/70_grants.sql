-- Reads only for signed-in users; roster changes (invite, role, archive) go through trusted server
-- code with the service role until team management adds its entry points.
revoke all on table access.admins from public, anon, authenticated, service_role;

grant select on table access.admins to authenticated;

grant select, insert, update on table access.admins to service_role;
