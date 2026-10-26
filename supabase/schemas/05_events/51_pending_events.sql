-- Receipts, never an id cursor: transactions can commit out of id order.
create or replace function events.pending_events(
  p_consumer text,
  p_limit integer default 100
)
returns setof events.domain_events
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

revoke all on function events.pending_events(text, integer) from public, anon, authenticated;

grant execute on function events.pending_events(text, integer) to service_role;
