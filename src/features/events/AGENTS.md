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
