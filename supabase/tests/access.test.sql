begin;

create extension if not exists pgtap with schema extensions;

select plan(44);

-- Shape, privileges and function attributes.

select has_schema('access');

select enum_has_labels(
  'access',
  'admin_role',
  array['owner', 'staff']
);

select enum_has_labels(
  'access',
  'permission',
  array[
    'orders.view',
    'orders.decide',
    'inventory.manage',
    'notifications.manage_own',
    'catalog.manage',
    'fulfillment.manage',
    'retail.manage',
    'themes.manage',
    'settings.manage',
    'admins.manage',
    'reports.view'
  ]
);

select has_table('access', 'admins', 'access.admins exists');

select ok(
  (select relrowsecurity from pg_class where oid = 'access.admins'::regclass),
  'admins has row level security enabled'
);

select policies_are(
  'access',
  'admins',
  array['admins_select_own', 'admins_select_for_managers']
);

select table_privs_are('access', 'admins', 'anon', array[]::text[]);

select table_privs_are('access', 'admins', 'authenticated', array['SELECT']);

select table_privs_are(
  'access',
  'admins',
  'service_role',
  array['SELECT', 'INSERT', 'UPDATE']
);

select function_privs_are(
  'access',
  'my_permissions',
  array[]::text[],
  'anon',
  array[]::text[]
);

select function_privs_are(
  'access',
  'my_permissions',
  array[]::text[],
  'authenticated',
  array['EXECUTE']
);

select function_privs_are(
  'private',
  'has_permission',
  array['access.permission'],
  'anon',
  array[]::text[]
);

select function_privs_are(
  'private',
  'role_permissions',
  array['access.admin_role'],
  'authenticated',
  array[]::text[]
);

select is_definer('private', 'has_permission', array['access.permission']);

select volatility_is('private', 'has_permission', array['access.permission'], 'stable');

-- The permission map.

select is(
  private.role_permissions('owner'),
  array[
    'orders.view',
    'orders.decide',
    'inventory.manage',
    'notifications.manage_own',
    'catalog.manage',
    'fulfillment.manage',
    'retail.manage',
    'themes.manage',
    'settings.manage',
    'admins.manage',
    'reports.view'
  ]::access.permission[],
  'owner has every permission'
);

select is(
  private.role_permissions('staff'),
  array[
    'orders.view',
    'orders.decide',
    'inventory.manage',
    'notifications.manage_own'
  ]::access.permission[],
  'staff handles orders, inventory and their own notifications'
);

select throws_ok(
  $$ select private.has_permission('orders.typo') $$,
  '22P02',
  null,
  'an unknown permission is rejected instead of silently denied'
);

-- Fixtures: an owner, a staff member, an archived owner and a signed-in user who is not an admin.

insert into auth.users (id, email)
values
  ('10000000-0000-7000-8000-00000000000a', 'owner@access.test'),
  ('10000000-0000-7000-8000-00000000000b', 'staff@access.test'),
  ('10000000-0000-7000-8000-00000000000c', 'archived@access.test'),
  ('10000000-0000-7000-8000-00000000000d', 'customer@access.test');

insert into access.admins (user_id, display_name, role)
values ('10000000-0000-7000-8000-00000000000a', 'Owner', 'owner');

insert into access.admins (user_id, display_name, role, archived_at)
values
  ('10000000-0000-7000-8000-00000000000b', 'Staff', 'staff', null),
  ('10000000-0000-7000-8000-00000000000c', 'Archived', 'owner', now());

-- Staff.

set local role authenticated;

set local "request.jwt.claims" to '{"sub": "10000000-0000-7000-8000-00000000000b", "role": "authenticated"}';

select ok(
  private.has_permission('orders.decide'),
  'staff may decide orders'
);

select ok(
  not private.has_permission('catalog.manage'),
  'staff may not manage the catalog'
);

select is(
  access.my_permissions(),
  array[
    'orders.view',
    'orders.decide',
    'inventory.manage',
    'notifications.manage_own'
  ]::access.permission[],
  'my_permissions returns the staff permissions'
);

select results_eq(
  $$ select user_id from access.admins $$,
  $$ values ('10000000-0000-7000-8000-00000000000b'::uuid) $$,
  'staff sees only their own admin row'
);

select throws_ok(
  $$ update access.admins set display_name = 'Renamed' $$,
  '42501',
  null,
  'authenticated users cannot update admins directly'
);

select throws_ok(
  $$ insert into access.admins (user_id, display_name) values ('10000000-0000-7000-8000-00000000000d', 'New') $$,
  '42501',
  null,
  'authenticated users cannot insert admins directly'
);

select throws_ok(
  $$ delete from access.admins $$,
  '42501',
  null,
  'authenticated users cannot delete admins'
);

-- Owner.

set local "request.jwt.claims" to '{"sub": "10000000-0000-7000-8000-00000000000a", "role": "authenticated"}';

select ok(
  private.has_permission('admins.manage'),
  'owner may manage admins'
);

select is(
  access.my_permissions(),
  array[
    'orders.view',
    'orders.decide',
    'inventory.manage',
    'notifications.manage_own',
    'catalog.manage',
    'fulfillment.manage',
    'retail.manage',
    'themes.manage',
    'settings.manage',
    'admins.manage',
    'reports.view'
  ]::access.permission[],
  'my_permissions returns the owner permissions'
);

select ok(
  exists (
    select 1
    from access.admins
    where user_id = '10000000-0000-7000-8000-00000000000c'
  ),
  'an admin manager sees archived admins'
);

-- Archived owner.

set local "request.jwt.claims" to '{"sub": "10000000-0000-7000-8000-00000000000c", "role": "authenticated"}';

select ok(
  not private.has_permission('orders.view'),
  'an archived admin has no permissions'
);

select is(
  access.my_permissions(),
  '{}'::access.permission[],
  'my_permissions is empty for an archived admin'
);

select is_empty(
  $$ select user_id from access.admins $$,
  'an archived admin cannot read the roster or their own row'
);

-- Signed-in user who is not an admin.

set local "request.jwt.claims" to '{"sub": "10000000-0000-7000-8000-00000000000d", "role": "authenticated"}';

select ok(
  not private.has_permission('orders.view'),
  'a user who is not an admin has no permissions'
);

select is(
  access.my_permissions(),
  '{}'::access.permission[],
  'my_permissions is empty for a user who is not an admin'
);

select is_empty(
  $$ select user_id from access.admins $$,
  'a user who is not an admin sees no admins'
);

-- Authenticated role without a user id.

set local "request.jwt.claims" to '{"role": "authenticated"}';

select ok(
  not private.has_permission('orders.view'),
  'no user id means no permissions'
);

select is(
  access.my_permissions(),
  '{}'::access.permission[],
  'my_permissions is empty without a user id'
);

-- Anonymous visitors.

reset role;

set local role anon;

set local "request.jwt.claims" to '{"role": "anon"}';

select throws_ok(
  $$ select user_id from access.admins $$,
  '42501',
  null,
  'anon cannot read admins'
);

select throws_ok(
  $$ select access.my_permissions() $$,
  '42501',
  null,
  'anon cannot call my_permissions'
);

-- Active-owner guard. Demote every other owner (seed data included) so the fixture owner is the
-- only one left.

reset role;

update access.admins
set role = 'staff'
where role = 'owner'
  and archived_at is null
  and user_id <> '10000000-0000-7000-8000-00000000000a';

select throws_ok(
  $$ update access.admins set role = 'staff' where user_id = '10000000-0000-7000-8000-00000000000a' $$,
  'P0001',
  'owner_required',
  'the last active owner cannot be demoted'
);

select throws_ok(
  $$ update access.admins set archived_at = now() where user_id = '10000000-0000-7000-8000-00000000000a' $$,
  'P0001',
  'owner_required',
  'the last active owner cannot be archived'
);

select throws_ok(
  $$ delete from access.admins where user_id = '10000000-0000-7000-8000-00000000000a' $$,
  'P0001',
  'owner_required',
  'the last active owner cannot be deleted'
);

select lives_ok(
  $$
    update access.admins set role = 'owner' where user_id = '10000000-0000-7000-8000-00000000000b';
    update access.admins set role = 'staff' where user_id = '10000000-0000-7000-8000-00000000000a';
  $$,
  'ownership can move to another admin when a new owner is promoted first'
);

-- Bootstrap: the first admin of an empty roster must be an active owner.

-- Replica mode skips the owner guard and the foreign keys of rows other features attribute to admins.
set local session_replication_role = replica;

delete from access.admins;

set local session_replication_role = origin;

select throws_ok(
  $$ insert into access.admins (user_id, display_name, role) values ('10000000-0000-7000-8000-00000000000d', 'First', 'staff') $$,
  'P0001',
  'owner_required',
  'an empty roster cannot start with a staff member'
);

select lives_ok(
  $$ insert into access.admins (user_id, display_name, role) values ('10000000-0000-7000-8000-00000000000d', 'First', 'owner') $$,
  'an empty roster starts with an owner'
);

select * from finish();

rollback;
