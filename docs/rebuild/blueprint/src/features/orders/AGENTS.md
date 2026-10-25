# features/orders

## Purpose
The order aggregate: orders, items, fulfillment subtypes, payments, refunds, the status state machine and its event log, plus the admin order queue.

## Owns / does not own
- **Owns:** schema `orders` (customers, orders, order_items, order_pickups, order_deliveries, payments, refunds, order_status_transitions, order_events, settings), the `orders.place_order` and `*_transition_order` entry points, and the admin orders UI.
- **Does not own:** the checkout form (`checkout`), stock math (`inventory`, called from SQL), sending emails or Telegram messages (`notifications` reads our events), file uploads (`media`).

## Public API (`index.ts`)
- Types: `OrderDto`, `OrderStatus`, `OrderEvent`, `PlaceOrderRequest`, `TransitionInput`
- Capabilities (`server/capabilities.ts`): `getOrder` (`orders.get`), `transitionOrder` (`orders.transition`). Used by the web Server Actions and by `admin-chat`.
- Events (`domain/events.ts`): Zod payload schemas for `order.placed` v1 and `order.status_changed` v1, used by `notifications`.
- Server: `placeOrder(request)` (used by checkout), `transitionOrderAction`, `listOrders`, `getOrder`
- Hooks: `useOrderQueue(orders)`, `useOrderActions(order)`
- UI: `OrderQueue`, `OrderDetail`, `OrderStatusBadge`

## Invariants
- The state machine is the `order_status_transitions` table; see `docs/domain/order-lifecycle.md`. The UI reads it to render actions and never hard-codes transitions.
- Prices, fees, totals and stock are resolved **inside** `place_order` from DB values; client values are ignored.
- **Placed ≠ confirmed.** Payment starts `submitted`; only a transition to `confirmed` sets it `verified`.
- Exactly one of `order_pickups` / `order_deliveries` exists, matching `orders.fulfillment_method` (composite FK).
- Orders, items, payments, refunds and events are never updated by table writes or deleted. Status changes only through `private.transition_order`.
- Refunds are full-amount, at most one per payment, and required when cancelling a paid order.
- Re-applying the current status is a no-op (idempotent).
- `place_order` and `private.transition_order` publish `order.placed` / `order.status_changed` with `private.publish_event` in the same transaction. Payloads include everything an alert or email needs (number, contact, items, totals, fulfillment summary, brand ids, proof file id, note, actor name).
- This feature never imports `notifications`, `messaging` or `admin-chat`.

## Dependencies
`catalog`, `fulfillment`, `inventory` (types), `media` (proof file refs), `access` (`requirePermission`). SQL reads `catalog`, `fulfillment` and `inventory` tables inside entry points.

## Testing
- pgTAP: every transition allowed/denied, stock released on reject/cancel, refund rules, idempotent replay, fingerprint conflict, RLS per role.
- Unit: DTO mapping, action input schemas.
- e2e: place order → admin confirms; admin rejects with refund.

## Gotchas
- `order_number` is for humans (`SNK-000123`); URLs and relations use `id`.
- Display dates in `America/Costa_Rica`.
- The success page must say payment is under review, not "order confirmed".
