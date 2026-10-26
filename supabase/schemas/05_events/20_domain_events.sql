-- Append-only history: occurred_at replaces created_at; there is no mutable updated_at.
create table events.domain_events (
  id uuid not null default private.uuid_v7(),
  type text not null,
  version smallint not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  payload jsonb not null,
  actor_type events.actor_type not null,
  actor_admin_id uuid,
  occurred_at timestamptz not null default now(),

  constraint domain_events_pkey primary key (id),
  constraint domain_events_type_check check (type ~ '^[a-z_]+\.[a-z_]+$'),
  constraint domain_events_version_check check (version > 0),
  constraint domain_events_aggregate_type_check check (char_length(btrim(aggregate_type)) > 0),
  constraint domain_events_actor_admin_id_fkey foreign key (actor_admin_id)
    references access.admins (user_id)
);

create index domain_events_actor_admin_id_idx on events.domain_events (actor_admin_id);

create index domain_events_occurred_at_id_idx on events.domain_events (occurred_at, id);

alter table events.domain_events enable row level security;
