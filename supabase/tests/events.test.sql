begin;
select plan(46);

select has_schema('events');
select has_table('events', 'domain_events', 'immutable domain event log');
select has_table('events', 'event_receipts', 'per-consumer receipts');
select columns_are('events', 'domain_events', array[
  'id', 'type', 'version', 'aggregate_type', 'aggregate_id', 'payload',
  'actor_type', 'actor_admin_id', 'occurred_at'
], 'event envelope columns');
select columns_are('events', 'event_receipts', array[
  'consumer', 'event_id', 'status', 'attempts', 'last_error', 'processed_at'
], 'receipt columns');
select enum_has_labels('events', 'actor_type', array['customer', 'admin', 'system'], 'actor values');
select enum_has_labels('events', 'receipt_status', array['processed', 'failed'], 'receipt values');
select col_is_pk('events', 'domain_events', 'id', 'event id is primary key');
select col_is_pk('events', 'event_receipts', array['consumer', 'event_id']);
select has_index('events', 'domain_events', 'domain_events_actor_admin_id_idx', 'actor FK indexed');
select has_index('events', 'event_receipts', 'event_receipts_event_id_idx', 'event FK indexed');
select ok((select relrowsecurity from pg_class where oid = 'events.domain_events'::regclass), 'events RLS');
select ok((select relrowsecurity from pg_class where oid = 'events.event_receipts'::regclass), 'receipts RLS');

select ok(not has_schema_privilege('anon', 'events', 'usage'), 'anon has no schema access');
select ok(not has_schema_privilege('authenticated', 'events', 'usage'), 'authenticated has no schema access');
select ok(not has_table_privilege('anon', 'events.domain_events', 'select,insert,update,delete'), 'anon has no event privileges');
select ok(not has_table_privilege('authenticated', 'events.domain_events', 'select,insert,update,delete'), 'authenticated has no event privileges');
select ok(not has_table_privilege('anon', 'events.event_receipts', 'select,insert,update,delete'), 'anon has no receipt privileges');
select ok(not has_table_privilege('authenticated', 'events.event_receipts', 'select,insert,update,delete'), 'authenticated has no receipt privileges');
select ok(not has_table_privilege('service_role', 'events.domain_events', 'insert,update,delete'), 'service cannot mutate events directly');
select ok(not has_table_privilege('service_role', 'events.event_receipts', 'insert,update,delete'), 'service writes receipts only by RPC');
select ok(not exists (
  select 1 from pg_proc as functions
  join pg_namespace as namespaces on namespaces.oid = functions.pronamespace
  where namespaces.nspname = 'events'
    and (has_function_privilege('anon', functions.oid, 'execute')
      or has_function_privilege('authenticated', functions.oid, 'execute'))
), 'no API consumer functions granted to shoppers');
select ok(not exists (
  select 1 from pg_proc as functions
  join pg_namespace as namespaces on namespaces.oid = functions.pronamespace
  cross join (values ('anon'), ('authenticated'), ('service_role')) as roles(name)
  where namespaces.nspname = 'private' and functions.proname = 'publish_event'
    and has_function_privilege(roles.name, functions.oid, 'execute')
), 'no API role can publish');

create temporary table fixture (id uuid);
insert into fixture values (private.publish_event(
  'order.placed', 1, 'order', '00000000-0000-7000-8000-000000000001',
  '{"number":"SN-TEST"}', 'system'
));
select is((select type from events.domain_events where id = (select id from fixture)), 'order.placed', 'publishes type');
select is((select payload from events.domain_events where id = (select id from fixture)), '{"number":"SN-TEST"}'::jsonb, 'publishes payload');
select is(substring((select id::text from fixture), 15, 1), '7', 'event UUID is v7');
select throws_ok($$ select private.publish_event('order', 1, 'order', gen_random_uuid(), '{}', 'system') $$, '23514', null, 'type must have two parts');
select throws_ok($$ select private.publish_event('Order.placed', 1, 'order', gen_random_uuid(), '{}', 'system') $$, '23514', null, 'type must be lowercase');
select throws_ok($$ select private.publish_event('order.placed', 0, 'order', gen_random_uuid(), '{}', 'system') $$, '23514', null, 'version is positive');

savepoint publishing;
select private.publish_event('order.rolled_back', 1, 'order', gen_random_uuid(), '{}', 'system');
rollback to publishing;
select is((select count(*)::integer from events.domain_events where type = 'order.rolled_back'), 0, 'publishing rolls back with transaction');

select is((select count(*)::integer from events.pending_events('events_test', 100) where id = (select id from fixture)), 1, 'new event is pending');
select events.record_receipt('events_test', (select id from fixture), 'failed', 'handler_failed');
select is((select attempts from events.event_receipts where consumer = 'events_test'), 1, 'first failure counts once');
select is((select count(*)::integer from events.pending_events('events_test', 100) where id = (select id from fixture)), 1, 'failure retries');
select events.record_receipt('events_test', (select id from fixture), 'failed', 'handler_failed');
select is((select attempts from events.event_receipts where consumer = 'events_test'), 2, 'retry increments atomically');
select events.record_receipt('events_test', (select id from fixture), 'processed');
select is((select count(*)::integer from events.pending_events('events_test', 100) where id = (select id from fixture)), 0, 'processed is excluded');
select ok((select processed_at is not null and last_error is null from events.event_receipts where consumer = 'events_test'), 'success clears error and records time');
select events.record_receipt('events_test', (select id from fixture), 'processed');
select events.record_receipt('events_test', (select id from fixture), 'failed', 'handler_failed');
select is((select attempts from events.event_receipts where consumer = 'events_test'), 3, 'processed receipt is terminal and re-runs are idempotent');
select is((select status::text from events.event_receipts where consumer = 'events_test'), 'processed', 'late failure cannot undo success');
select is((select count(*)::integer from events.pending_events('another_consumer', 100) where id = (select id from fixture)), 1, 'consumers are independent');

do $$ begin
  for attempt in 1..6 loop
    perform events.record_receipt('exhausted', (select id from fixture), 'failed', 'handler_failed');
  end loop;
end $$;
select is((select attempts from events.event_receipts where consumer = 'exhausted'), 5, 'failed attempts capped at five');
select is((select count(*)::integer from events.pending_events('exhausted', 100) where id = (select id from fixture)), 0, 'exhausted event is skipped');
select ok((select processed_at is null and last_error = 'handler_failed' from events.event_receipts where consumer = 'exhausted'), 'failure retains error without processed timestamp');
select throws_ok($$ select * from events.pending_events('', 100) $$, '22023', 'invalid_consumer', 'blank consumer refused');
select throws_ok($$ select * from events.pending_events('events_test', 0) $$, '22023', 'invalid_limit', 'invalid limit refused');
select throws_ok($$ select events.record_receipt('events_test', gen_random_uuid(), 'processed') $$, '23503', null, 'receipt requires event');
select ok((select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid = 'private.publish_event(text,integer,text,uuid,jsonb,events.actor_type,uuid)'::regprocedure), 'publisher is hardened security definer');

select * from finish();
rollback;
