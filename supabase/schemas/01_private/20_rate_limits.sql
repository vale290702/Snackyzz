-- One row per HMAC key and scope; no raw IP addresses are retained.
create table private.rate_limits (
  key text not null,
  window_started_at timestamptz not null default now(),
  requests integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint rate_limits_pkey primary key (key)
);

alter table private.rate_limits enable row level security;

revoke all on table private.rate_limits from public, anon, authenticated, service_role;
