-- Transactional event log and per-consumer receipts. Only trusted server jobs use this API.
create schema if not exists events;

revoke all on schema events from public, anon, authenticated;

grant usage on schema events to service_role;
