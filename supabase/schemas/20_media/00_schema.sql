create schema if not exists media;

revoke all on schema media from public;

grant usage on schema media to anon, authenticated, service_role;
