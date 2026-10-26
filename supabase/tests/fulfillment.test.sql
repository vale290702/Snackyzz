begin;

create extension if not exists pgtap with schema extensions;

select no_plan();

-- Shape

select has_schema('fulfillment');

select tables_are('fulfillment', array[
  'pickup_locations',
  'pickup_location_hours',
  'delivery_zones',
  'delivery_hours',
  'settings'
]);

select columns_are('fulfillment', 'pickup_locations', array[
  'id', 'name', 'address', 'city', 'map_url', 'instructions', 'sort_order', 'archived_at',
  'created_at', 'updated_at', 'created_by', 'updated_by'
]);

select columns_are('fulfillment', 'pickup_location_hours', array[
  'id', 'pickup_location_id', 'weekday', 'opens_at', 'closes_at', 'created_at', 'created_by'
]);

select columns_are('fulfillment', 'delivery_zones', array[
  'id', 'name', 'fee', 'sort_order', 'archived_at', 'created_at', 'updated_at', 'created_by', 'updated_by'
]);

select columns_are('fulfillment', 'delivery_hours', array[
  'id', 'weekday', 'opens_at', 'closes_at', 'created_at', 'created_by'
]);

select columns_are('fulfillment', 'settings', array[
  'id', 'is_pickup_enabled', 'is_delivery_enabled', 'delivery_lead_hours', 'delivery_slot_hours',
  'timezone', 'created_at', 'updated_at', 'updated_by'
]);

select col_type_is('fulfillment', 'delivery_zones', 'fee', 'amount_crc', 'fee is amount_crc');

select ok(
  (select bool_and(relrowsecurity) from pg_class where relnamespace = 'fulfillment'::regnamespace and relkind = 'r'),
  'every fulfillment table has RLS'
);

select has_index('fulfillment', 'pickup_location_hours', 'pickup_location_hours_pickup_location_id_idx', 'pickup_location_id indexed');
select has_index('fulfillment', 'delivery_zones', 'delivery_zones_name_key', 'one active zone per name');
select has_index('fulfillment', 'pickup_locations', 'pickup_locations_created_by_idx', 'created_by indexed');
select has_index('fulfillment', 'settings', 'settings_updated_by_idx', 'updated_by indexed');

select results_eq(
  $$select is_pickup_enabled, is_delivery_enabled, delivery_lead_hours, delivery_slot_hours, timezone
    from fulfillment.settings$$,
  $$values (true, true, 6, 3, 'America/Costa_Rica'::text)$$,
  'the data migration creates the settings singleton with today''s defaults'
);

-- Grants

select table_privs_are('fulfillment', 'pickup_locations', 'anon', array['SELECT']);
select table_privs_are('fulfillment', 'pickup_location_hours', 'anon', array['SELECT']);
select table_privs_are('fulfillment', 'delivery_zones', 'anon', array['SELECT']);
select table_privs_are('fulfillment', 'delivery_hours', 'anon', array['SELECT']);
select table_privs_are('fulfillment', 'settings', 'anon', array['SELECT']);

select table_privs_are('fulfillment', 'pickup_locations', 'authenticated', array['SELECT', 'INSERT', 'UPDATE']);
select table_privs_are('fulfillment', 'pickup_location_hours', 'authenticated', array['SELECT', 'INSERT', 'DELETE']);
select table_privs_are('fulfillment', 'delivery_zones', 'authenticated', array['SELECT', 'INSERT', 'UPDATE']);
select table_privs_are('fulfillment', 'delivery_hours', 'authenticated', array['SELECT', 'INSERT', 'DELETE']);
select table_privs_are('fulfillment', 'settings', 'authenticated', array['SELECT', 'UPDATE']);

select table_privs_are('fulfillment', 'pickup_locations', 'service_role', array['SELECT', 'INSERT', 'UPDATE']);
select table_privs_are('fulfillment', 'pickup_location_hours', 'service_role', array['SELECT', 'INSERT', 'DELETE']);
select table_privs_are('fulfillment', 'delivery_zones', 'service_role', array['SELECT', 'INSERT', 'UPDATE']);
select table_privs_are('fulfillment', 'delivery_hours', 'service_role', array['SELECT', 'INSERT', 'DELETE']);
select table_privs_are('fulfillment', 'settings', 'service_role', array['SELECT', 'UPDATE']);

select function_privs_are('fulfillment', 'set_pickup_location_hours', array['uuid', 'jsonb'], 'anon', array[]::text[]);
select function_privs_are('fulfillment', 'set_pickup_location_hours', array['uuid', 'jsonb'], 'authenticated', array['EXECUTE']);
select function_privs_are('fulfillment', 'set_pickup_location_hours', array['uuid', 'jsonb'], 'service_role', array[]::text[]);
select function_privs_are('fulfillment', 'set_delivery_hours', array['jsonb'], 'anon', array[]::text[]);
select function_privs_are('fulfillment', 'set_delivery_hours', array['jsonb'], 'authenticated', array['EXECUTE']);
select function_privs_are('fulfillment', 'set_delivery_hours', array['jsonb'], 'service_role', array[]::text[]);

-- Policies

select policies_are('fulfillment', 'pickup_locations', array[
  'pickup_locations_select_active', 'pickup_locations_select_for_managers',
  'pickup_locations_insert_for_managers', 'pickup_locations_update_for_managers'
]);
select policies_are('fulfillment', 'pickup_location_hours', array[
  'pickup_location_hours_select_active', 'pickup_location_hours_select_for_managers',
  'pickup_location_hours_insert_for_managers', 'pickup_location_hours_delete_for_managers'
]);
select policies_are('fulfillment', 'delivery_zones', array[
  'delivery_zones_select_active', 'delivery_zones_select_for_managers',
  'delivery_zones_insert_for_managers', 'delivery_zones_update_for_managers'
]);
select policies_are('fulfillment', 'delivery_hours', array[
  'delivery_hours_select_all', 'delivery_hours_insert_for_managers', 'delivery_hours_delete_for_managers'
]);
select policies_are('fulfillment', 'settings', array['settings_select_all', 'settings_update_for_managers']);

-- Fixtures: an owner (fulfillment.manage), a staff member, an archived owner and a signed-in
-- customer. Fixture names start with pgtap; the seed's rows stay as they are.

insert into auth.users (id, email)
values
  ('40000000-0000-7000-8000-00000000000a', 'owner@fulfillment-pgtap.test'),
  ('40000000-0000-7000-8000-00000000000b', 'staff@fulfillment-pgtap.test'),
  ('40000000-0000-7000-8000-00000000000c', 'archived@fulfillment-pgtap.test'),
  ('40000000-0000-7000-8000-00000000000d', 'customer@fulfillment-pgtap.test');

insert into access.admins (user_id, display_name, role, archived_at)
values
  ('40000000-0000-7000-8000-00000000000a', 'Fulfillment Owner', 'owner', null),
  ('40000000-0000-7000-8000-00000000000b', 'Fulfillment Staff', 'staff', null),
  ('40000000-0000-7000-8000-00000000000c', 'Fulfillment Archived', 'owner', now());

insert into fulfillment.pickup_locations (id, name, address, city, archived_at)
values
  ('40000000-0000-7000-8000-0000000000a1', 'pgtap active', 'Dirección', 'Escazú', null),
  ('40000000-0000-7000-8000-0000000000a2', 'pgtap archived', 'Dirección', 'Escazú', now());

insert into fulfillment.pickup_location_hours (pickup_location_id, weekday, opens_at, closes_at)
values
  ('40000000-0000-7000-8000-0000000000a1', 1, '09:00', '12:00'),
  ('40000000-0000-7000-8000-0000000000a1', 1, '14:00', '18:00'),
  ('40000000-0000-7000-8000-0000000000a2', 1, '09:00', '18:00');

insert into fulfillment.delivery_zones (id, name, fee, archived_at)
values
  ('40000000-0000-7000-8000-0000000000b1', 'pgtap active', 1500, null),
  ('40000000-0000-7000-8000-0000000000b2', 'pgtap archived', 2000, now());

-- Constraints

select throws_ok(
  $$insert into fulfillment.pickup_locations (name, address, city) values ('', 'Dirección', 'Escazú')$$,
  '23514', null, 'pickup location names are not empty'
);
select throws_ok(
  $$insert into fulfillment.pickup_locations (name, address, city, map_url)
    values ('pgtap map', 'Dirección', 'Escazú', 'http://maps.example.com')$$,
  '23514', null, 'map links use https'
);
select throws_ok(
  $$insert into fulfillment.pickup_location_hours (pickup_location_id, weekday, opens_at, closes_at)
    values ('40000000-0000-7000-8000-0000000000a1', 8, '09:00', '10:00')$$,
  '23514', null, 'weekdays are ISO 1 to 7'
);
select throws_ok(
  $$insert into fulfillment.pickup_location_hours (pickup_location_id, weekday, opens_at, closes_at)
    values ('40000000-0000-7000-8000-0000000000a1', 2, '18:00', '09:00')$$,
  '23514', null, 'pickup hours close after they open'
);
select throws_ok(
  $$insert into fulfillment.pickup_location_hours (pickup_location_id, weekday, opens_at, closes_at)
    values ('40000000-0000-7000-8000-0000000000a1', 2, '09:00:30', '10:00')$$,
  '23514', null, 'hours are whole minutes'
);
select throws_ok(
  $$insert into fulfillment.pickup_location_hours (pickup_location_id, weekday, opens_at, closes_at)
    values ('40000000-0000-7000-8000-0000000000a1', 1, '11:00', '15:00')$$,
  '23P01', null, 'a location''s hours do not overlap on the same weekday'
);
select lives_ok(
  $$insert into fulfillment.pickup_location_hours (pickup_location_id, weekday, opens_at, closes_at)
    values
      ('40000000-0000-7000-8000-0000000000a1', 1, '12:00', '13:00'),
      ('40000000-0000-7000-8000-0000000000a1', 2, '11:00', '15:00'),
      ('40000000-0000-7000-8000-0000000000a2', 2, '11:00', '15:00')$$,
  'touching ranges, other weekdays and other locations do not overlap'
);
select throws_ok(
  $$insert into fulfillment.delivery_zones (name, fee) values ('pgtap negative', -1)$$,
  '23514', null, 'fees are not negative'
);
select throws_ok(
  $$insert into fulfillment.delivery_zones (name, fee) values ('PGTAP Active', 1000)$$,
  '23505', null, 'two active zones cannot share a name, ignoring case'
);
select lives_ok(
  $$insert into fulfillment.delivery_zones (name, fee) values ('pgtap archived', 0)$$,
  'an archived zone''s name can be reused, and delivery can be free'
);
select throws_ok(
  $$insert into fulfillment.delivery_hours (weekday, opens_at, closes_at) values (1, '17:00', '19:00')$$,
  '23P01', null, 'delivery hours do not overlap the seeded Monday'
);
select throws_ok(
  $$insert into fulfillment.delivery_hours (weekday, opens_at, closes_at) values (0, '09:00', '10:00')$$,
  '23514', null, 'delivery weekdays are ISO 1 to 7'
);
select throws_ok(
  $$update fulfillment.settings set delivery_slot_hours = 13$$,
  '23514', null, 'delivery windows last 1 to 12 hours'
);
select throws_ok(
  $$update fulfillment.settings set delivery_lead_hours = 169$$,
  '23514', null, 'delivery notice is at most a week'
);
select throws_ok(
  $$insert into fulfillment.settings (id) values (false)$$,
  '23514', null, 'settings is a singleton'
);

-- anon

set local role anon;

select is((select count(*) from fulfillment.pickup_locations where name like 'pgtap%'), 1::bigint, 'anon sees active pickup locations only');
select is(
  (select count(*) from fulfillment.pickup_location_hours where pickup_location_id::text like '40000000-%'),
  4::bigint,
  'anon sees the hours of active pickup locations only'
);
select is((select count(*) from fulfillment.delivery_zones where name like 'pgtap%'), 2::bigint, 'anon sees active zones only');
select is((select count(*) from fulfillment.delivery_hours), 6::bigint, 'anon reads delivery hours');
select is((select delivery_slot_hours from fulfillment.settings), 3, 'anon reads settings');
select throws_ok(
  $$insert into fulfillment.delivery_zones (name, fee) values ('pgtap anon', 1)$$,
  '42501', null, 'anon cannot create zones'
);
select throws_ok(
  $$update fulfillment.settings set delivery_lead_hours = 1$$,
  '42501', null, 'anon cannot change settings'
);
select throws_ok(
  $$select fulfillment.set_delivery_hours('[]')$$,
  '42501', null, 'anon cannot replace delivery hours'
);

reset role;

-- A signed-in customer, staff and an archived owner get shopper access only.

select set_config('request.jwt.claim.sub', '40000000-0000-7000-8000-00000000000d', true);
set local role authenticated;

select is((select count(*) from fulfillment.pickup_locations where name like 'pgtap%'), 1::bigint, 'customers see active pickup locations only');
select is((select count(*) from fulfillment.delivery_zones where name like 'pgtap%'), 2::bigint, 'customers see active zones only');
select throws_ok(
  $$insert into fulfillment.pickup_locations (name, address, city, created_by, updated_by)
    values ('pgtap customer', 'Dirección', 'Escazú', '40000000-0000-7000-8000-00000000000d', '40000000-0000-7000-8000-00000000000d')$$,
  '42501', null, 'customers cannot create pickup locations'
);
select is_empty(
  $$update fulfillment.settings set delivery_lead_hours = 1, updated_by = '40000000-0000-7000-8000-00000000000d' returning id$$,
  'customers cannot change settings'
);

reset role;

select set_config('request.jwt.claim.sub', '40000000-0000-7000-8000-00000000000b', true);
set local role authenticated;

select is((select count(*) from fulfillment.delivery_zones where name like 'pgtap%'), 2::bigint, 'staff see active zones only');
select throws_ok(
  $$insert into fulfillment.delivery_zones (name, fee, created_by, updated_by)
    values ('pgtap staff', 1, '40000000-0000-7000-8000-00000000000b', '40000000-0000-7000-8000-00000000000b')$$,
  '42501', null, 'staff cannot create zones'
);
select is_empty(
  $$update fulfillment.pickup_locations set name = 'pgtap staff edit', updated_by = '40000000-0000-7000-8000-00000000000b'
    where id = '40000000-0000-7000-8000-0000000000a1' returning id$$,
  'staff cannot update pickup locations'
);
select is_empty(
  $$delete from fulfillment.delivery_hours returning id$$,
  'staff cannot delete delivery hours'
);
select is_empty(
  $$delete from fulfillment.pickup_location_hours returning id$$,
  'staff cannot delete pickup hours'
);
select throws_ok(
  $$select fulfillment.set_pickup_location_hours('40000000-0000-7000-8000-0000000000a1', '[]')$$,
  '42501', null, 'staff cannot replace pickup hours'
);
select throws_ok(
  $$select fulfillment.set_delivery_hours('[]')$$,
  '42501', null, 'staff cannot replace delivery hours'
);

reset role;

select set_config('request.jwt.claim.sub', '40000000-0000-7000-8000-00000000000c', true);
set local role authenticated;

select is((select count(*) from fulfillment.pickup_locations where name like 'pgtap%'), 1::bigint, 'archived owners see active pickup locations only');
select is_empty(
  $$update fulfillment.delivery_zones set fee = 1, updated_by = '40000000-0000-7000-8000-00000000000c'
    where id = '40000000-0000-7000-8000-0000000000b1' returning id$$,
  'archived owners cannot update zones'
);
select throws_ok(
  $$select fulfillment.set_delivery_hours('[]')$$,
  '42501', null, 'archived owners cannot replace delivery hours'
);

reset role;

-- Owner (fulfillment.manage)

select set_config('request.jwt.claim.sub', '40000000-0000-7000-8000-00000000000a', true);
set local role authenticated;

select is((select count(*) from fulfillment.pickup_locations where name like 'pgtap%'), 2::bigint, 'managers see archived pickup locations');
select is(
  (select count(*) from fulfillment.pickup_location_hours where pickup_location_id::text like '40000000-%'),
  6::bigint,
  'managers see the hours of archived pickup locations'
);
select is((select count(*) from fulfillment.delivery_zones where name like 'pgtap%'), 3::bigint, 'managers see archived zones');

select lives_ok(
  $$insert into fulfillment.delivery_zones (name, fee, created_by, updated_by)
    values ('pgtap owner', 1000, '40000000-0000-7000-8000-00000000000a', '40000000-0000-7000-8000-00000000000a')$$,
  'managers create zones as themselves'
);
select throws_ok(
  $$insert into fulfillment.pickup_locations (name, address, city, created_by, updated_by)
    values ('pgtap forged', 'Dirección', 'Escazú', '40000000-0000-7000-8000-00000000000b', '40000000-0000-7000-8000-00000000000b')$$,
  '42501', null, 'managers cannot create rows in someone else''s name'
);
select isnt_empty(
  $$update fulfillment.pickup_locations set name = 'pgtap owner edit', updated_by = '40000000-0000-7000-8000-00000000000a'
    where id = '40000000-0000-7000-8000-0000000000a1' returning id$$,
  'managers update pickup locations as themselves'
);
select throws_ok(
  $$update fulfillment.delivery_zones set fee = 1, updated_by = '40000000-0000-7000-8000-00000000000b'
    where id = '40000000-0000-7000-8000-0000000000b1'$$,
  '42501', null, 'managers cannot update rows in someone else''s name'
);
select isnt_empty(
  $$update fulfillment.settings set delivery_lead_hours = 12, updated_by = '40000000-0000-7000-8000-00000000000a' returning id$$,
  'managers change settings as themselves'
);
select throws_ok(
  $$update fulfillment.settings set delivery_lead_hours = 24, updated_by = '40000000-0000-7000-8000-00000000000b'$$,
  '42501', null, 'managers cannot change settings in someone else''s name'
);
select throws_ok(
  $$delete from fulfillment.delivery_zones where id = '40000000-0000-7000-8000-0000000000b2'$$,
  '42501', null, 'zones are archived, never deleted'
);
select throws_ok(
  $$insert into fulfillment.delivery_hours (weekday, opens_at, closes_at, created_by)
    values (7, '09:00', '10:00', '40000000-0000-7000-8000-00000000000b')$$,
  '42501', null, 'managers cannot add hours in someone else''s name'
);

select lives_ok(
  $$select fulfillment.set_pickup_location_hours(
    '40000000-0000-7000-8000-0000000000a1',
    '[{"weekday": 3, "opens_at": "08:00", "closes_at": "11:00"},
      {"weekday": 3, "opens_at": "13:00", "closes_at": "16:30"}]'
  )$$,
  'managers replace a pickup location''s hours'
);
select results_eq(
  $$select weekday::integer, opens_at, closes_at, created_by from fulfillment.pickup_location_hours
    where pickup_location_id = '40000000-0000-7000-8000-0000000000a1' order by opens_at$$,
  $$values
    (3, '08:00'::time, '11:00'::time, '40000000-0000-7000-8000-00000000000a'::uuid),
    (3, '13:00'::time, '16:30'::time, '40000000-0000-7000-8000-00000000000a'::uuid)$$,
  'only the new hours remain, attributed to the manager'
);
select throws_ok(
  $$select fulfillment.set_pickup_location_hours(
    '40000000-0000-7000-8000-0000000000a1',
    '[{"weekday": 4, "opens_at": "08:00", "closes_at": "12:00"},
      {"weekday": 4, "opens_at": "11:00", "closes_at": "16:00"}]'
  )$$,
  '23P01', null, 'overlapping replacement hours are refused'
);
select throws_ok(
  $$select fulfillment.set_pickup_location_hours(
    '40000000-0000-7000-8000-0000000000a1',
    '[{"weekday": 4, "opens_at": "12:00", "closes_at": "08:00"}]'
  )$$,
  '23514', null, 'inverted replacement hours are refused'
);
select throws_ok(
  $$select fulfillment.set_pickup_location_hours('40000000-0000-7000-8000-0000000000a2', '[]')$$,
  'P0001', 'pickup_location_not_found', 'an archived location''s hours cannot be replaced'
);
select throws_ok(
  $$select fulfillment.set_pickup_location_hours('40000000-0000-7000-8000-0000000000ff', '[]')$$,
  'P0001', 'pickup_location_not_found', 'an unknown location''s hours cannot be replaced'
);

select lives_ok(
  $$select fulfillment.set_delivery_hours(
    '[{"weekday": 5, "opens_at": "10:00", "closes_at": "14:00"}]'
  )$$,
  'managers replace the delivery hours'
);
select results_eq(
  $$select weekday::integer, opens_at, closes_at from fulfillment.delivery_hours$$,
  $$values (5, '10:00'::time, '14:00'::time)$$,
  'only the new delivery hours remain'
);
select lives_ok(
  $$select fulfillment.set_delivery_hours('[]')$$,
  'an empty schedule closes delivery on every weekday'
);
select is_empty($$select id from fulfillment.delivery_hours$$, 'no delivery hours remain');

reset role;

-- service_role bypasses RLS for trusted server code.

set local role service_role;

select is((select count(*) from fulfillment.pickup_locations where name like 'pgtap%'), 2::bigint, 'service role reads every pickup location');
select is((select count(*) from fulfillment.delivery_zones where name like 'pgtap%'), 4::bigint, 'service role reads every zone');
select throws_ok(
  $$select fulfillment.set_delivery_hours('[]')$$,
  '42501', null, 'service role does not call the admin entry points'
);

reset role;

select * from finish();
rollback;
