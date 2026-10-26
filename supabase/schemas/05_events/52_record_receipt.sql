-- Atomic upsert serializes concurrent receipts. Success is terminal; late failures cannot undo it.
create or replace function events.record_receipt(
  p_consumer text,
  p_event_id uuid,
  p_status events.receipt_status,
  p_last_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

revoke all on function events.record_receipt(text, uuid, events.receipt_status, text)
  from public, anon, authenticated;

grant execute on function events.record_receipt(text, uuid, events.receipt_status, text) to service_role;
