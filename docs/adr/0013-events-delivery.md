# 0013. Receipt-based event delivery

- **Status:** proposed
- **Date:** 2026-10-25
- **Approver:** Alejandro Loaiza
- **Refs:** ADR 0006, ER §10, DB-13

## Context

The transactional outbox needs a small service-only delivery API without importing its consumers. Transactions can commit out of UUID order; retrying external effects must be safe.

## Decision

Keep events immutable and publish only through an owner-only SQL helper within publisher transactions. Expose bounded pending reads and atomic receipt recording to service_role, with select-only diagnostic table grants and no shopper access. Successful receipts are terminal; failures retry up to five times. Use the ER's event/receipt timestamps rather than generic creation/update columns.

Pass named consumers explicitly to a server-only runner. Handlers parse publisher payloads and return Results, acknowledging irrelevant events. Expected failures and thrown bugs both leave a safe failure code in receipts; payloads and raw messages are never logged. A secret-authenticated POST route is the composition root, initially with no consumers. Publishers await a bounded kick inside `after()`.

Delivery is at least once. Handlers must deduplicate queued effects by event id and recipient; receipts alone cannot make external effects exactly once. Each invocation handles at most 100 events per consumer. No cron or consumer implementations are included.

## Alternatives

An id cursor can miss late commits. Claim leases add unnecessary coordination for a low-volume shop and do not remove the need for side-effect deduplication. Direct service-role table writes weaken the immutability and receipt invariants.

## Consequences

New consumers do not change publishers. Concurrent invocations can deliver duplicates, so queue deduplication is mandatory. Exhausted failures remain available for later admin diagnostics; replay UI and scheduled retries arrive with the first real consumers. No dependencies are added.
