create type events.actor_type as enum (
  'customer',
  'admin',
  'system'
);

create type events.receipt_status as enum (
  'processed',
  'failed'
);
