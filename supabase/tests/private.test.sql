begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

select has_schema('private');

select is(
  substring(private.uuid_v7()::text from 15 for 1),
  '7',
  'uuid_v7 sets version 7'
);

select ok(
  substring(private.uuid_v7()::text from 20 for 1) in ('8', '9', 'a', 'b'),
  'uuid_v7 sets the RFC 9562 variant'
);

select ok(
  (
    select bool_and(previous_id < id)
    from (
      select
        id,
        lag(id) over (order by position) as previous_id
      from (
        select
          position,
          private.uuid_v7() as id
        from generate_series(1, 50) as position
      ) as generated
    ) as ordered
    where previous_id is not null
      and left(previous_id::text, 13) <> left(id::text, 13)
  ) is not false,
  'uuid_v7 values from later milliseconds sort after earlier ones'
);

select function_privs_are(
  'private',
  'uuid_v7',
  array[]::text[],
  'anon',
  array[]::text[],
  'anon cannot generate ids directly'
);

select throws_ok(
  $$ select (-1)::public.amount_crc $$,
  '23514',
  null,
  'amount_crc rejects negative amounts'
);

select is(
  1500::public.amount_crc,
  1500::public.amount_crc,
  'amount_crc accepts whole colones'
);

create temporary table updated_at_probe (
  id integer primary key,
  updated_at timestamptz not null
);

create trigger set_updated_at
before update on updated_at_probe
for each row
execute function private.set_updated_at();

insert into updated_at_probe (id, updated_at)
values (1, '2000-01-01');

update updated_at_probe
set id = 1
where id = 1;

select is(
  (select updated_at from updated_at_probe where id = 1),
  now(),
  'set_updated_at stamps the update time'
);

select * from finish();

rollback;
