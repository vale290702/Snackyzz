revoke all on table media.files from public, anon, authenticated, service_role;

grant select on table media.files to anon, authenticated;

grant select, insert, delete on table media.files to service_role;
