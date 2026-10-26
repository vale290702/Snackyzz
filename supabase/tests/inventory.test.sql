begin;

create extension if not exists pgtap with schema extensions;

select no_plan();

select has_schema('inventory');
select tables_are('inventory', array['stock_levels', 'stock_movements']);
select columns_are('inventory', 'stock_levels', array[
  'id', 'variant_id', 'pickup_location_id', 'is_global', 'quantity_available', 'created_at', 'updated_at'
]);
select columns_are('inventory', 'stock_movements', array[
  'id', 'stock_level_id', 'quantity_delta', 'reason', 'note', 'created_by', 'created_at'
]);
select enum_has_labels('inventory', 'movement_reason', array[
  'adjustment', 'restock', 'waste', 'order_reservation', 'order_release'
]);
select ok((select bool_and(relrowsecurity) from pg_class
  where relnamespace = 'inventory'::regnamespace and relkind = 'r'), 'RLS on every table');
select policies_are('inventory', 'stock_levels', array['stock_levels_select_for_managers']);
select policies_are('inventory', 'stock_movements', array['stock_movements_select_for_managers']);
select has_index('inventory', 'stock_levels', 'stock_levels_variant_id_pickup_location_id_key', 'stock_levels_variant_id_pickup_location_id_key exists');
select has_index('inventory', 'stock_levels', 'stock_levels_pickup_location_id_idx', 'stock_levels_pickup_location_id_idx exists');
select has_index('inventory', 'stock_movements', 'stock_movements_stock_level_id_id_idx', 'stock_movements_stock_level_id_id_idx exists');
select has_index('inventory', 'stock_movements', 'stock_movements_created_by_idx', 'stock_movements_created_by_idx exists');

select table_privs_are('inventory', table_name, role_name, privileges)
from (values ('stock_levels'), ('stock_movements')) as tables(table_name)
cross join (values
  ('anon', array[]::text[]),
  ('authenticated', array['SELECT']),
  ('service_role', array['SELECT'])
) as roles(role_name, privileges);

select function_privs_are('inventory', 'adjust_stock', array['uuid', 'integer', 'uuid', 'text'], role_name, privileges)
from (values ('anon', array[]::text[]), ('authenticated', array['EXECUTE']), ('service_role', array[]::text[]))
  as roles(role_name, privileges);
select function_privs_are('inventory', 'variant_availability', array['uuid[]', 'uuid'], role_name, array['EXECUTE'])
from (values ('anon'), ('authenticated'), ('service_role')) as roles(role_name);
select function_privs_are('private', 'apply_stock_movement',
  array['uuid', 'integer', 'inventory.movement_reason', 'uuid', 'uuid', 'text', 'boolean'], role_name, array[]::text[])
from (values ('anon'), ('authenticated'), ('service_role')) as roles(role_name);
select function_privs_are('private', 'resolve_stock_level', array['uuid', 'uuid'], role_name, array[]::text[])
from (values ('anon'), ('authenticated'), ('service_role')) as roles(role_name);

insert into auth.users (id, email)
values
  ('10000000-0000-7000-8000-000000000090', 'archived@inventory-pgtap.test'),
  ('10000000-0000-7000-8000-000000000091', 'owner@inventory-pgtap.test'),
  ('10000000-0000-7000-8000-000000000092', 'staff@inventory-pgtap.test'),
  ('10000000-0000-7000-8000-000000000099', 'customer@inventory-pgtap.test');
insert into access.admins (user_id, display_name, role, archived_at)
values
  ('10000000-0000-7000-8000-000000000091', 'Inventory Owner', 'owner', null),
  ('10000000-0000-7000-8000-000000000092', 'Inventory Staff', 'staff', null),
  ('10000000-0000-7000-8000-000000000090', 'Archived Inventory Owner', 'owner', now());

insert into catalog.brands (id, slug, name)
values ('10000000-0000-7000-8000-000000000010', 'inventory-test', 'Inventory');
insert into fulfillment.pickup_locations (id, name, address, city)
values ('10000000-0000-7000-8000-000000000011', 'Inventory pickup', 'Test address', 'Escazú');

-- Independent fixtures; every role sees the same pools and ledger.
insert into catalog.products (id, brand_id, slug, name, description, accent_color)
values ('10000000-0000-7000-8000-000000000001', '10000000-0000-7000-8000-000000000010', 'inventory-test', 'Stock', 'Stock', '#123456');
insert into catalog.product_variants (id, product_id, name, price, is_stock_tracked)
values
  ('10000000-0000-7000-8000-000000000002', '10000000-0000-7000-8000-000000000001', 'Tracked', 100, true),
  ('10000000-0000-7000-8000-000000000003', '10000000-0000-7000-8000-000000000001', 'Untracked', 100, false),
  ('10000000-0000-7000-8000-000000000004', '10000000-0000-7000-8000-000000000001', 'Missing pool', 100, true),
  ('10000000-0000-7000-8000-000000000005', '10000000-0000-7000-8000-000000000001', 'Archived', 100, true);
update catalog.product_variants set archived_at = now() where id = '10000000-0000-7000-8000-000000000005';
select private.apply_stock_movement('10000000-0000-7000-8000-000000000002', 5, 'restock');
select private.apply_stock_movement('10000000-0000-7000-8000-000000000002', 0, 'restock', '10000000-0000-7000-8000-000000000011');

select is((select quantity_available from inventory.stock_levels where variant_id = '10000000-0000-7000-8000-000000000002' and is_global), 5);
select is((select count(*)::integer from inventory.stock_movements as movements join inventory.stock_levels as levels
  on levels.id = movements.stock_level_id where levels.variant_id = '10000000-0000-7000-8000-000000000002'), 1, 'zero initialization has no zero movement');
select is(private.resolve_stock_level('10000000-0000-7000-8000-000000000002'),
  (select id from inventory.stock_levels where variant_id = '10000000-0000-7000-8000-000000000002' and is_global), 'delivery resolves global');
select is(private.resolve_stock_level('10000000-0000-7000-8000-000000000002', '10000000-0000-7000-8000-000000000011'),
  (select id from inventory.stock_levels where variant_id = '10000000-0000-7000-8000-000000000002' and not is_global), 'empty local pool wins');
select is(private.resolve_stock_level('10000000-0000-7000-8000-000000000003'), null::uuid, 'untracked has no pool');
select is(private.resolve_stock_level('10000000-0000-7000-8000-000000000002', '10000000-0000-7000-8000-000000000099'),
  private.resolve_stock_level('10000000-0000-7000-8000-000000000002'), 'unknown location falls back to global');
select throws_ok($$insert into inventory.stock_levels (variant_id) values ('10000000-0000-7000-8000-000000000002')$$,
  '23505', null, 'nulls not distinct prevents duplicate global pool');
select throws_ok($$insert into inventory.stock_levels (variant_id, pickup_location_id) values ('10000000-0000-7000-8000-000000000002', '10000000-0000-7000-8000-000000000011')$$,
  '23505', null, 'unique location pool');
select throws_ok($$update inventory.stock_levels set quantity_available = -1 where variant_id = '10000000-0000-7000-8000-000000000002'$$,
  '23514', null, 'no negative stock');
select throws_ok($$insert into inventory.stock_movements (stock_level_id, quantity_delta, reason)
  select id, 0, 'restock' from inventory.stock_levels where variant_id = '10000000-0000-7000-8000-000000000002' and is_global$$,
  '23514', null, 'no zero movements');
select throws_ok($$select private.apply_stock_movement('10000000-0000-7000-8000-000000000002', -6, 'waste')$$,
  '23514', null, 'writer cannot oversell');
select is((select quantity_available from inventory.stock_levels where variant_id = '10000000-0000-7000-8000-000000000002' and is_global), 5, 'failed movement rolls back');
select throws_ok($$select private.apply_stock_movement('10000000-0000-7000-8000-000000000002', -1, 'order_reservation')$$,
  '23514', null, 'order movements deferred until order_id exists');
select throws_ok($$select private.apply_stock_movement('10000000-0000-7000-8000-000000000003', 1, 'restock')$$,
  'P0001', 'variant_not_stock_tracked');

select throws_ok($$select private.apply_stock_movement('10000000-0000-7000-8000-000000000002', 1, 'restock', null, null, '')$$,
  '23514', null, 'empty notes rejected atomically');
select throws_ok($$select private.apply_stock_movement('10000000-0000-7000-8000-000000000002', 1, 'restock', null, null, repeat('x', 501))$$,
  '23514', null, 'long notes rejected atomically');
select throws_ok($$select private.apply_stock_movement('10000000-0000-7000-8000-000000000002', 1, 'restock', null, '10000000-0000-7000-8000-000000000099')$$,
  '23503', null, 'unknown actor rejected atomically');
select is((select quantity_available from inventory.stock_levels where variant_id = '10000000-0000-7000-8000-000000000002' and is_global), 5, 'invalid ledger inserts roll back quantity changes');
select throws_ok($$insert into inventory.stock_levels (variant_id) values ('10000000-0000-7000-8000-000000000099')$$,
  '23503', null, 'variant FK enforced');
select throws_ok($$insert into inventory.stock_levels (variant_id, pickup_location_id) values ('10000000-0000-7000-8000-000000000002', '10000000-0000-7000-8000-000000000099')$$,
  '23503', null, 'pickup location FK enforced');

-- Policy x role matrix. Service bypasses RLS, but still has no writes or admin entry point.
create temporary table expected_inventory_counts as select
  (select count(*)::integer from inventory.stock_levels) as levels,
  (select count(*)::integer from inventory.stock_movements) as movements;
grant select on expected_inventory_counts to authenticated, service_role;

set local role anon;
select throws_ok($$select * from inventory.stock_levels$$, '42501', null, 'anon cannot read quantities');
select throws_ok($$select * from inventory.stock_movements$$, '42501', null, 'anon cannot read ledger');
select throws_ok($$select inventory.adjust_stock('10000000-0000-7000-8000-000000000002', 9)$$, '42501', null, 'anon cannot adjust');
select results_eq($$select variant_id, is_available from inventory.variant_availability(array[
  '10000000-0000-7000-8000-000000000002'::uuid, '10000000-0000-7000-8000-000000000003'::uuid,
  '10000000-0000-7000-8000-000000000004'::uuid, '10000000-0000-7000-8000-000000000005'::uuid]) order by variant_id$$,
  $$values ('10000000-0000-7000-8000-000000000002'::uuid, true),
    ('10000000-0000-7000-8000-000000000003'::uuid, true),
    ('10000000-0000-7000-8000-000000000004'::uuid, false)$$, 'anonymous availability hides archived rows and quantities');
select is((select is_available from inventory.variant_availability(array['10000000-0000-7000-8000-000000000002'::uuid], '10000000-0000-7000-8000-000000000011')), false, 'empty local never falls back');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-7000-8000-000000000099","role":"authenticated"}', true);
select is((select count(*)::integer from inventory.stock_levels), 0, 'customer cannot see levels');
select is((select count(*)::integer from inventory.stock_movements), 0, 'customer cannot see movements');
select throws_ok($$select inventory.adjust_stock('10000000-0000-7000-8000-000000000002', 9)$$, '42501', 'permission_denied', 'customer cannot adjust');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-7000-8000-000000000090","role":"authenticated"}', true);
select is((select count(*)::integer from inventory.stock_levels), 0, 'archived owner cannot see levels');
select is((select count(*)::integer from inventory.stock_movements), 0, 'archived owner cannot see movements');
select throws_ok($$select inventory.adjust_stock('10000000-0000-7000-8000-000000000002', 9)$$, '42501', 'permission_denied', 'archived owner cannot adjust');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"10000000-0000-7000-8000-000000000092","role":"authenticated"}', true);
select is((select count(*)::integer from inventory.stock_levels), (select levels from expected_inventory_counts), 'staff sees levels');
select is((select count(*)::integer from inventory.stock_movements), (select movements from expected_inventory_counts), 'staff sees movements');
select lives_ok($$select inventory.adjust_stock('10000000-0000-7000-8000-000000000002', 9, null, 'Count')$$, 'staff adjusts');
select is((select quantity_delta from inventory.stock_movements where note = 'Count'), 4, 'adjustment records delta');
select is((select created_by from inventory.stock_movements where note = 'Count'), '10000000-0000-7000-8000-000000000092'::uuid, 'actor from auth uid');
select lives_ok($$select inventory.adjust_stock('10000000-0000-7000-8000-000000000002', 9)$$, 'same target is no-op');
select is((select count(*)::integer from inventory.stock_movements), (select movements + 1 from expected_inventory_counts), 'no-op appends nothing');
select throws_ok($$select inventory.adjust_stock('10000000-0000-7000-8000-000000000002', -1)$$, 'P0001', 'invalid_stock_quantity');
select throws_ok($$update inventory.stock_levels set quantity_available = 99 where true$$, '42501', null, 'staff cannot bypass writer');
select throws_ok($$delete from inventory.stock_movements where true$$, '42501', null, 'staff cannot delete ledger');

select set_config('request.jwt.claims', '{"sub":"10000000-0000-7000-8000-000000000091","role":"authenticated"}', true);
select is((select count(*)::integer from inventory.stock_levels), (select levels from expected_inventory_counts), 'owner sees levels');
select is((select count(*)::integer from inventory.stock_movements), (select movements + 1 from expected_inventory_counts), 'owner sees ledger');
select lives_ok($$select inventory.adjust_stock('10000000-0000-7000-8000-000000000002', 2)$$, 'owner adjusts downward');
select throws_ok($$select inventory.adjust_stock('10000000-0000-7000-8000-000000000002', 2, '10000000-0000-7000-8000-000000000099')$$, 'P0001', 'pickup_location_not_found');
select throws_ok($$insert into inventory.stock_levels (variant_id) values ('10000000-0000-7000-8000-000000000003')$$, '42501', null, 'owner cannot insert pools');
reset role;

set local role service_role;
select is((select count(*)::integer from inventory.stock_levels), (select levels from expected_inventory_counts), 'service sees levels');
select is((select count(*)::integer from inventory.stock_movements), (select movements + 2 from expected_inventory_counts), 'service sees ledger');
select throws_ok($$update inventory.stock_levels set quantity_available = 99 where true$$, '42501', null, 'service cannot bypass writer');
select throws_ok($$select inventory.adjust_stock('10000000-0000-7000-8000-000000000002', 99)$$, '42501', null, 'service cannot impersonate admin');
reset role;

select * from finish();
rollback;
