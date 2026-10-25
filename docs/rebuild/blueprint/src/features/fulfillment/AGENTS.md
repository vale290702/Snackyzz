# features/fulfillment

## Purpose
How online orders reach customers: **Snackyzz-managed pickup locations** and their hours, delivery zones and fees, the delivery schedule, and delivery-window generation.

## Owns / does not own
- **Owns:** schema `fulfillment` (pickup_locations, pickup_location_hours, delivery_zones, delivery_hours, settings), the fulfillment step used by checkout, the pickup section of the "Where to buy" page, and admin management.
- **Does not own:** third-party points of sale (`retail`, which never appear in checkout), stock at pickup locations (`inventory`), or the fulfillment records on orders (`orders.order_pickups` / `order_deliveries`).

## Public API (`index.ts`)
- Types: `PickupLocationDto`, `DeliveryZoneDto`, `DeliveryWindow`, `FulfillmentSettings`
- Domain: `listDeliveryWindows(input)`, `isWindowAvailable(window, input)`, `deliveryFee(zone)`, `isPickupLocationOpen(hours, at)`
- Server: `getFulfillmentOptions()` (cached, tag `fulfillment`), admin actions for pickup locations, hours, zones and settings
- Hooks: `useFulfillmentPicker(options)`, `useFulfillmentManager()`
- UI: `PickupLocationList`, `FulfillmentPicker`, admin `FulfillmentManager`

## Invariants
- A pickup location is run by Snackyzz and is where online orders are collected. A store that merely sells our products is a **point of sale** (`retail`), never a pickup location.
- Delivery-window logic is **pure** (`domain/delivery-windows.ts`). Inputs: hours, lead/slot hours, `now`, timezone. Checkout uses the same function to render windows and to re-validate the chosen one server-side.
- All schedule math happens in `America/Costa_Rica`; store `timestamptz`, compare in that zone.
- A weekday without hour rows is closed. Weekdays are ISO (1 = Monday).
- Fees go through `deliveryFee()`, so a future pricing strategy (distance, free over X) is one function change.
- Pickup has no date or window (parity).

## Dependencies
`access`.

## Testing
- Unit (TDD): windows across midnight, lead time pushing into the next day, closed days, slot sizes 1–12 h.
- Hooks: picker switches method and clears the stale window or location.
- Integration: admin hours CRUD rejects overlapping or inverted ranges.

## Gotchas
- Inject `now`; never call `Date.now()` inside domain code.
- Couriers and holiday closures are designed but not built (ER design §7).
