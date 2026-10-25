# 0005. Model fulfillment methods as subtype tables with a discriminator FK

- **Status:** accepted
- **Date:** 2026-10-24
- **Approver:** Alejandro Loaiza
- **Refs:** DB-08, DB-09

## Context

`orders` had ten nullable fulfillment columns whose validity depended on `fulfillment_type`.

## Decision

`orders.orders.fulfillment_method` is the discriminator with `unique (id, fulfillment_method)`. `orders.order_pickups` and `orders.order_deliveries` each carry a constant-checked `fulfillment_method` column and a composite FK to `(id, fulfillment_method)`. All their columns are `not null`.

## Alternatives considered

- **Single table + CHECKs** — works, but leaves nullable columns and grows with every method.
- **JSONB details** — unvalidated shape, no FKs.

## Consequences

Mismatched subtypes are impossible at the DB level. "Exactly one subtype row" is guaranteed by `place_order` and tested with pgTAP. A new method = enum value + one table.
