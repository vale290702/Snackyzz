-- Time-ordered uuid (RFC 9562 v7). Swap the body for native uuidv7() on Postgres 18+.
create or replace function private.uuid_v7()
returns uuid
language sql
volatile
set search_path = ''
as $$
  select encode(
    set_bit(
      set_bit(
        overlay(
          uuid_send(gen_random_uuid())
          placing substring(int8send((extract(epoch from clock_timestamp()) * 1000)::bigint) from 3)
          from 1 for 6
        ),
        52,
        1
      ),
      53,
      1
    ),
    'hex'
  )::uuid;
$$;

revoke execute on function private.uuid_v7() from public;

grant execute on function private.uuid_v7() to authenticated, service_role;

-- Trigger: keeps updated_at current on every update.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();

  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public;
