# features/reporting

## Purpose
Read-only sales insight for owners: sales by day, brand, product/variant and delivery zone.

## Owns / does not own
- **Owns:** schema `reporting` (security-definer functions, no tables) and the admin Reports UI (scope: open question O-2).
- **Does not own:** any data; it reads `orders`, `catalog` and `fulfillment`.

## Public API (`index.ts`)
- Types: `SalesByDay`, `SalesByVariant`, `SalesByBrand`, `SalesByZone`, `DateRange`
- Server: `getSalesReport(range)`
- UI: `ReportsDashboard`

## Invariants
- Revenue counts orders in `confirmed`, `ready_for_pickup`, `out_for_delivery`, `completed`. Never `pending_review`, `rejected` or `cancelled`.
- Days are grouped in `America/Costa_Rica`.
- Every function checks `reports.view` (owners only).
- Reports read snapshots (`order_items.unit_price`, `brand_id`), so renamed or repriced products report historically correct values.

## Dependencies
`access`.

## Testing
- pgTAP: totals on a fixture order set, including cancelled/rejected exclusions and the day boundary at local midnight.

## Gotchas
- If a report needs a new aggregate, add a function; don't query base tables from TS.
