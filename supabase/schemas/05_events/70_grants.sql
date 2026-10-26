revoke all on table events.domain_events, events.event_receipts
  from public, anon, authenticated, service_role;

-- Diagnostics only; all writes go through the narrowly scoped functions.
grant select on table events.domain_events, events.event_receipts to service_role;
