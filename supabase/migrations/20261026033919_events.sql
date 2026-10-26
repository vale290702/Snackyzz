set local check_function_bodies = off;

create schema "events";

create table "events"."domain_events" (
  "type"           text     not null,
  "version"        smallint not null,
  "aggregate_type" text     not null,
  "aggregate_id"   uuid     not null,
  "payload"        jsonb    not null,
  constraint "domain_events_aggregate_type_check" check ((char_length(btrim(aggregate_type)) > 0)),
  constraint "domain_events_type_check" check ((type ~ '^[a-z_]+\.[a-z_]+$'::text)),
  constraint "domain_events_version_check" check ((version > 0)),
  "id"             uuid     not null default private.uuid_v7(),
  constraint "domain_events_pkey" primary key (id)
);

alter table "events"."domain_events"
  enable row level security;

create table "events"."event_receipts" (
  "consumer" text not null,
  "event_id" uuid not null,
  constraint "event_receipts_consumer_check"
    check (((char_length(btrim(consumer)) >= 1) AND (char_length(btrim(consumer)) <= 100))),
  constraint "event_receipts_pkey" primary key (consumer, event_id)
);

alter table "events"."event_receipts"
  enable row level security;

create type "events"."actor_type" as enum (
  'customer',
  'admin',
  'system'
);

alter table "events"."domain_events"
  add column "actor_type" events.actor_type not null;

alter table "events"."domain_events"
  add column "actor_admin_id" uuid;

alter table "events"."domain_events"
  add column "occurred_at" timestamp with time zone not null default now();

create type "events"."receipt_status" as enum (
  'processed',
  'failed'
);

alter table "events"."event_receipts"
  add column "status" events.receipt_status not null;

alter table "events"."event_receipts"
  add column "attempts" integer not null default 1;

alter table "events"."event_receipts"
  add column "last_error" text;

alter table "events"."event_receipts"
  add column "processed_at" timestamp with time zone;

create or replace function events.pending_events (
  p_consumer text,
  p_limit    integer default 100
)
  returns SETOF events.domain_events
  language plpgsql
  security definer
  set search_path to ''
  AS $function$
begin
  if p_consumer is null or char_length(btrim(p_consumer)) not between 1 and 100 then
    raise exception 'invalid_consumer' using errcode = '22023';
  end if;

  if p_limit is null or p_limit not between 1 and 1000 then
    raise exception 'invalid_limit' using errcode = '22023';
  end if;

  return query
    select domain_events.*
    from events.domain_events
    left join events.event_receipts as receipts
      on receipts.event_id = domain_events.id
      and receipts.consumer = p_consumer
    where receipts.event_id is null
      or (receipts.status = 'failed' and receipts.attempts < 5)
    order by domain_events.occurred_at, domain_events.id
    limit p_limit;
end;
$function$;

create or replace function events.record_receipt (
  p_consumer   text,
  p_event_id   uuid,
  p_status     events.receipt_status,
  p_last_error text                  default null::text
)
  returns void
  language plpgsql
  security definer
  set search_path to ''
  AS $function$
begin
  insert into events.event_receipts as receipts (
    consumer,
    event_id,
    status,
    attempts,
    last_error,
    processed_at
  ) values (
    p_consumer,
    p_event_id,
    p_status,
    1,
    case when p_status = 'failed' then p_last_error else null end,
    case when p_status = 'processed' then now() else null end
  )
  on conflict (consumer, event_id) do update
    set status = excluded.status,
        attempts = least(receipts.attempts + 1, 5),
        last_error = excluded.last_error,
        processed_at = excluded.processed_at
    where receipts.status = 'failed'
      and (receipts.attempts < 5 or excluded.status = 'processed');
end;
$function$;

create or replace function private.publish_event (
  p_type           text,
  p_version        integer,
  p_aggregate_type text,
  p_aggregate_id   uuid,
  p_payload        jsonb,
  p_actor_type     events.actor_type,
  p_actor_admin_id uuid              default null::uuid
)
  returns uuid
  language plpgsql
  security definer
  set search_path to ''
  AS $function$
declare
  v_event_id uuid;
begin
  insert into events.domain_events (
    type,
    version,
    aggregate_type,
    aggregate_id,
    payload,
    actor_type,
    actor_admin_id
  ) values (
    p_type,
    p_version,
    p_aggregate_type,
    p_aggregate_id,
    p_payload,
    p_actor_type,
    p_actor_admin_id
  )
  returning id into v_event_id;

  return v_event_id;
end;
$function$;

alter table "events"."domain_events"
  add constraint "domain_events_actor_admin_id_fkey" foreign key (actor_admin_id)
    references access.admins(user_id);

alter table "events"."event_receipts"
  add constraint "event_receipts_attempts_check" check (((attempts >= 1) AND (attempts <= 5)));

alter table "events"."event_receipts"
  add constraint "event_receipts_outcome_check"
    check ((((status = 'processed'::events.receipt_status) AND (processed_at IS
    NOT NULL) AND (last_error IS NULL)) OR
    ((status = 'failed'::events.receipt_status) AND (processed_at IS NULL) AND (last_error IS
    NOT NULL))));

create index domain_events_actor_admin_id_idx on events.domain_events using btree (actor_admin_id);

create index event_receipts_event_id_idx on events.event_receipts using btree (event_id);

revoke all on function "events"."pending_events"(text, integer) from public;

grant execute on function "events"."pending_events"(text, integer) to "service_role";

revoke all
  on function "events"."record_receipt"(text, uuid, events.receipt_status, text)
  from public;

grant execute
  on function "events"."record_receipt"(text, uuid, events.receipt_status, text)
  to "service_role";

revoke all
  on function "private"."publish_event"(text, integer, text, uuid, jsonb, events.actor_type, uuid)
  from public;

grant usage on schema "events" to "service_role";

grant select on table "events"."domain_events" to "service_role";

grant select on table "events"."event_receipts" to "service_role";

alter table "events"."event_receipts"
  add constraint "event_receipts_event_id_fkey" foreign key (event_id)
    references events.domain_events(id);

create index domain_events_occurred_at_id_idx on events.domain_events using btree (occurred_at, id);
