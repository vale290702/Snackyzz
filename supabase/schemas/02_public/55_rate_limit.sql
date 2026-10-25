-- PostgREST cannot call a private schema: a service-only invoker exposes this one operation.
create function public.consume_rate_limit(
  rate_key text,
  max_requests integer,
  window_seconds integer
)
returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.consume_rate_limit(rate_key, max_requests, window_seconds);
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
