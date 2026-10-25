set local check_function_bodies = off;

create schema "private";

create domain "public"."amount_crc" as integer constraint "amount_crc_check"
  check ((VALUE >= 0));

create or replace function private.set_updated_at()
  returns trigger
  language plpgsql
  set search_path to ''
  AS $function$
begin
  new.updated_at := now();

  return new;
end;
$function$;

create or replace function private.uuid_v7()
  returns uuid
  language sql
  set search_path to ''
  AS $function$
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
$function$;

revoke all on function "private"."set_updated_at"() from public;

revoke all on function "private"."uuid_v7"() from public;

grant execute on function "private"."uuid_v7"() to "authenticated", "service_role";

grant usage on schema "private" to "authenticated", "service_role";
