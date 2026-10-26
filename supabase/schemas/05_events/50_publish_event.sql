-- Only owner-executed SQL entry points publish, in the transaction making the domain change.
create or replace function private.publish_event(
  p_type text,
  p_version integer,
  p_aggregate_type text,
  p_aggregate_id uuid,
  p_payload jsonb,
  p_actor_type events.actor_type,
  p_actor_admin_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

revoke all on function private.publish_event(text, integer, text, uuid, jsonb, events.actor_type, uuid)
  from public, anon, authenticated, service_role;
