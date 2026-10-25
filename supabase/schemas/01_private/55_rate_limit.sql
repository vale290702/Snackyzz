-- Admits at most max_requests per key in a fixed window, atomically, in one upsert.
-- A refused request does not increment the counter, so it cannot overflow.
create function private.consume_rate_limit(
  rate_key text,
  max_requests integer,
  window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- clock_timestamp, not now(): now() is the transaction start, stale after waiting on the row lock.
  request_time timestamptz := clock_timestamp();
  window_cutoff timestamptz;
  admitted boolean;
begin
  if rate_key is null or char_length(rate_key) not between 1 and 128
    or max_requests is null or max_requests < 1
    or window_seconds is null or window_seconds < 1
  then
    raise exception 'invalid_rate_limit';
  end if;

  window_cutoff := request_time - make_interval(secs => window_seconds);

  insert into private.rate_limits as limits (key, window_started_at, requests)
  values (rate_key, request_time, 1)
  on conflict (key) do update
  set requests = case
        when limits.window_started_at <= window_cutoff then 1
        else limits.requests + 1
      end,
      window_started_at = case
        when limits.window_started_at <= window_cutoff then request_time
        else limits.window_started_at
      end,
      updated_at = request_time
  where limits.window_started_at <= window_cutoff
    or limits.requests < max_requests
  returning true into admitted;

  return coalesce(admitted, false);
end;
$$;

revoke all on function private.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function private.consume_rate_limit(text, integer, integer) to service_role;
