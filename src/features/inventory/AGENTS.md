# features/inventory

## Purpose

How many of each variant are available. Stock is **global by default**; a pickup location can optionally keep its own stock. An append-only ledger of movements backs every level.

## Owns / does not own

- **Owns:** schema `inventory` (stock_levels, stock_movements), `private.apply_stock_movement`, `private.resolve_stock_level`, `private.reserve_stock`, `inventory.variant_availability`, and the admin inventory UI.
- **Does not own:** when stock is reserved or released. `orders.place_order` and `private.transition_order` call our private functions.

## Public API (`index.ts`)

- Types: `StockLevelDto` (`scope: "global" | { pickupLocationId }`), `StockMovementDto`, `MovementReason`
- Server: `getAvailability(variantIds, pickupLocationId?)` (uncached), `listStockLevels`, `listMovements(stockLevelId)`, `adjustStockAction`, `enableLocationStockAction`, `disableLocationStockAction`
- Hooks: `useStockTable()`, `useAdjustStock(level)`
- UI: `StockTable`, `AdjustStockDialog`, `AvailabilityBadge`

## Invariants

- One global row per tracked variant (`pickup_location_id is null`). Location rows are **optional**: `unique nulls not distinct (variant_id, pickup_location_id)`.
- **Reservation rule:** untracked variant → nothing. Pickup at a location that has its own row for the variant → that row. Anything else (delivery, or a location without its own row) → global row.
- **Release** reverses exactly the order's `order_reservation` movements. Never recompute where stock came from.
- `private.apply_stock_movement` is the **only** writer of both tables. `quantity_available >= 0` is a DB check, so overselling fails atomically.
- Admin "set to N" is an `adjustment` movement with `delta = N − current`, never an overwrite.
- `order_*` movements always carry `order_id`.
- Disabling location stock is only allowed at quantity 0 (move units back to global first, with two movements).

## Dependencies

`catalog` (variant types), `fulfillment` (pickup location types), `access` (`inventory.manage`).

## Testing

- pgTAP: the reservation rule for every case, concurrent reservations can't oversell, release reverses the original rows, reason/order_id check, `nulls not distinct` uniqueness.
- Integration: adjust action writes one movement and updates the level.

## Gotchas

- Never cache availability; it's a dynamic hole in otherwise cached pages.
- Points of sale (`retail`) have no stock in our system.
