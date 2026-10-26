# features/events

## Purpose

The app-wide log of things that happened (`order.placed`, `order.status_changed`, …) and the runner that delivers new events to consumers. Lets features react to each other without calling each other.

## Owns / does not own

- **Owns:** schema `events` (domain_events, event_receipts), `private.publish_event`, `events.pending_events`, the consumer runner, and `/api/jobs/events`.
- **Does not own:** event payload schemas (each publisher owns them in `domain/events/*.schema.ts`) or what consumers do.

## Public API (`index.ts`)

- Types: `DomainEvent<TType, TPayload>`, `EventConsumer`
- Server: `runEventConsumers(consumers)` (called by the `/api/jobs/events` route with an explicit list), `kickEventConsumers()` (inside `after()`: a fire-and-forget POST to that route, so publishers never import consumers)

## Invariants

- Events are published **in the same transaction** as the change, from SQL entry points (`private.publish_event`). Never publish from TypeScript after a separate write.
- Events are immutable and never deleted.
- `type` is `<aggregate>.<past_tense>` (`order.placed`); payloads carry a `version`. A breaking payload change = new version; consumers handle both until the old one is gone.
- Payloads include everything consumers need (event-carried state), so consumers don't read the publisher's tables.
- A consumer marks an event handled by inserting `(consumer, event_id)` into `event_receipts` **after** its side effects are safely queued. Consumers must be idempotent.
- After a consumer fails on the same event 5 times, the runner records the error and moves on; the failure shows in admin.

## Dependencies

`shared/lib` only. Consumers depend on `events`, never the reverse.

## Testing

- pgTAP: `publish_event` rolls back with the surrounding transaction; `pending_events` excludes handled events per consumer.
- Integration: runner calls each registered consumer and records receipts; a throwing consumer doesn't block others.

## Gotchas

- Don't order processing by assuming ids reflect commit order; rely on receipts.

## Implemented delivery contract

`index.ts` is server-only. `runEventConsumers(consumers: readonly EventConsumer[])` returns `Result<EventRunSummary, EventErrorCode>` with `processed` and `failed` counts. Each consumer has a stable unique `name` and `handle(event: DomainEvent): Promise<Result<void>>`. Parse the publisher-owned payload schema/version before use, acknowledge unrelated events with `Results.ok(undefined)`, and queue idempotent side effects before succeeding. Each pass reads up to 100 events per consumer; later invocations drain the backlog.

The envelope uses camelCase (`aggregateType`, `aggregateId`, `actorType`, `actorAdminId`, `occurredAt`). `DomainEvent<EventType = string, Payload = unknown>` describes a payload after parsing. No publisher or consumer feature imports live here.

`private.publish_event(p_type text, p_version integer, p_aggregate_type text, p_aggregate_id uuid, p_payload jsonb, p_actor_type events.actor_type, p_actor_admin_id uuid default null) returns uuid` is owner-only. Publisher security-definer entry points call it within their transaction. Actor values: `customer | admin | system`.

`events.pending_events(p_consumer text, p_limit integer default 100)` returns rows ordered by `occurred_at, id`, with limit 1–1000. `events.record_receipt(p_consumer text, p_event_id uuid, p_status events.receipt_status, p_last_error text default null)` atomically counts attempts (at most five). Successful receipts are terminal; failures cannot overwrite success. Both RPCs are service-role only; service-role table access is read-only. Tables follow the ER timestamps without generic `created_at`/`updated_at` columns.

`POST /api/jobs/events` verifies `Bearer JOB_SECRET` before running consumers. Its explicit list is empty until notifications arrives. `EventJob.isAuthorized` and `EventJobStatus` support the composition root. Await `kickEventConsumers()` inside a publisher's `after()` callback: it returns a Result after a bounded 10-second POST, with safe failure codes. No cron is installed yet.

Delivery is at least once, including concurrent invocations or failure to save a receipt after queueing. Downstream queues must deduplicate by event/recipient. Logs and `last_error` contain only safe steps, ids and failure codes, never payloads or raw error messages. Failure UI is deferred.

## Local tests

Hold the shared notes `db-lock.md` before reset, pgTAP or integration runs. Integration fixtures use owner SQL through `docker exec supabase_db_snackyzz-rework psql` because publishing must stay inaccessible to every API role. Fixtures append synthetic events; unique consumer names isolate tests. The rebuild uses API 55321 and database 55322 alongside the legacy stack.
