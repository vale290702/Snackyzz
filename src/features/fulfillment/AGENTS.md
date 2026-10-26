# features/fulfillment

## Purpose

How online orders reach customers: **Snackyzz-managed pickup locations** and their hours, delivery zones and fees, the delivery schedule, and delivery-window generation.

## Owns / does not own

- **Owns:** schema `fulfillment` (pickup_locations, pickup_location_hours, delivery_zones, delivery_hours, settings), the delivery-window rules checkout uses, the public reads behind checkout's fulfillment step and the pickup section of the "Where to buy" page, and admin management.
- **Does not own:** third-party points of sale (`retail`, which never appear in checkout), stock at pickup locations (`inventory`), or the fulfillment records on orders (`orders.order_pickups` / `order_deliveries`).

## Public API (`index.ts`)

- Domain: `DeliveryWindows.list(input)` → `DeliveryWindow[]` (ISO `startsAt` / `endsAt`) and `DeliveryWindows.isAvailable(window, input)`; `DeliveryWindowInput` is `{ hours, leadHours, slotHours, timezone, now }`. `HourRange` is `{ weekday, opensAt, closesAt }` (ISO weekday, `HH:MM`).
- Queries (`'use cache'` + `cacheTag("fulfillment")` + `cacheLife("max")`, anon client):
  - `getFulfillmentOptions()` → `FulfillmentOptions` (`settings`, `pickupLocations: PickupLocationDto[]` with sorted `hours`, `deliveryZones: DeliveryZoneDto[]` with `fee`, `deliveryHours: HourRange[]`). Lists hold active rows whatever the settings say; checkout reads `settings.isPickupEnabled` / `isDeliveryEnabled` to decide what to offer.
  - `listPickupLocations()` → `PickupLocationDto[]` for "Where to buy".
- Admin actions (each `ActionResult<Record, FulfillmentErrorCode>`): `createPickupLocationAction`, `updatePickupLocationAction`, `archivePickupLocationAction`, `setPickupLocationHoursAction`; `createDeliveryZoneAction`, `updateDeliveryZoneAction`, `archiveDeliveryZoneAction`; `setDeliveryHoursAction`; `updateFulfillmentSettingsAction`.
- Types: admin records `PickupLocation`, `PickupLocationHours`, `DeliveryZone`, `DeliveryHours`, `FulfillmentSettings`; DTOs `PickupLocationDto`, `DeliveryZoneDto`, `FulfillmentOptions`; `FulfillmentErrorCode`.

## Layout

- `domain/fields/`: `FulfillmentFields` (ids, sort order, text, https map link, fee, weekday, `HH:MM` time, toggle, hour counts) and `FulfillmentFieldError` codes; limits mirror the SQL checks. `recordIdInputSchema` for archiving.
- `domain/<pickup-locations|delivery-zones|settings>/`: input schemas and limits. Settings inputs never carry the time zone.
- `domain/hours/`: `hourRangeSchema` (`hours_inverted`), `weeklyHoursSchema` (`hours_overlap`, `too_many_hours`, sorted output), the two set-hours inputs, `HourRanges` (minutes, sort, overlap).
- `domain/delivery-windows/`: `DeliveryWindows` and `ZonedTime` (calendar math in an IANA zone with `Intl` only). Pure; `now` is always injected.
- `domain/errors/`: `FulfillmentError`; Spanish copy for both code sets in `errors.fulfillment`.
- `server/<pickup-locations|delivery-zones|hours|settings>/`: row schema (snake_case → record), repository (module functions behind a small factory), capabilities, actions.
- `server/mutation/`: `FulfillmentPermission`, `FULFILLMENT_CACHE_TAG`, `runFulfillmentMutation` (admin context → capability → `updateTag("fulfillment")`), `FulfillmentResults` (PostgREST response → `Result`: the parsed row, or a code for known constraint names and raised messages; anything else is rethrown).
- `server/options/`: anon repository, DTO row schemas, `getFulfillmentOptions`, `listPickupLocations`.
- `server/testing/`: integration-test helpers only (in-memory cookies, demo admins, unique names).

## Invariants

- A pickup location is run by Snackyzz and is where online orders are collected. A store that merely sells our products is a **point of sale** (`retail`), never a pickup location.
- Delivery-window logic is **pure**. Inputs: hours, lead/slot hours, `now`, time zone. Each open range is cut into back-to-back windows of `slotHours` from its opening time (a shorter tail is dropped), for 14 days from today, keeping those that start at least `leadHours` after `now`. Checkout uses the same function to render windows and to re-validate the chosen one server-side.
- Schedules are wall-clock times in `settings.timezone` (`America/Costa_Rica`, not editable); windows are instants (`timestamptz` on orders).
- A weekday without hour rows is closed. Weekdays are ISO (1 = Monday). Ranges on one weekday never overlap (Zod first, then exclusion constraints); touching ranges (9–12, 12–15) are fine. Hours are replaced as a weekly set, atomically, through the `set_*_hours` entry points.
- A zone's fee is a flat `amount_crc` (zero = free). Orders read the fee in SQL at `place_order`; nothing in TS computes fees.
- Two active zones can't share a name, ignoring case; archiving frees it.
- Writes go through RLS as the signed-in admin (`fulfillment.manage`) with `created_by` / `updated_by` = caller. Locations and zones are archived, never deleted; past orders keep referencing them.
- Pickup has no date or window (parity).

## Dependencies

`access` (`getAdminContext`, `fulfillment.manage`).

## Testing

- Unit (TDD): `DeliveryWindows` (lead time into the next day, local date across midnight UTC, closed days, short tails, slot sizes 1–12 h, split ranges, horizon, availability), `ZonedTime` (including a DST zone), every input schema, `FulfillmentResults`; `messages.test.ts` covers `errors.fulfillment`.
- Integration (`*.int.test.ts`, local stack): every action for visitor / staff / owner, archive rules, taken zone names, hours replacement (ordered, overlapping and inverted refused, archived location refused, empty schedule), settings, and the public queries' filtering. Tests that change delivery hours or settings restore them afterwards; locations and zones use unique `int-*` names.
- pgTAP `fulfillment.test.sql`: shape, grants, every policy × role, constraints, exclusion constraints and both entry points.

## Follow-ups

- Admin `FulfillmentManager` (`useFulfillmentManager`): forms need `FormInput` support for checkboxes and repeated hour rows.
- Checkout `FulfillmentPicker` (`useFulfillmentPicker`) and the "Where to buy" `PickupLocationList`, plus the `fulfillment` UI namespace.
- Admin reads that include archived rows, unarchiving, and exposing the capabilities to `admin-chat`.

## Gotchas

- Inject `now`; never call `Date.now()` inside domain code.
- `index.ts` is server-only (it exports the queries and actions). A client hook that needs `DeliveryWindows` must import a client-safe entry; add one when the first hook lands rather than importing `domain/` across features.
- Every admin mutation must go through `runFulfillmentMutation`, or checkout stays stale. Delivery windows are never cached: they depend on `now`.
- API requests load `pg_safeupdate`: SQL run through PostgREST can't `delete` without a `where` clause, which pgTAP (psql) doesn't catch. Integration tests do.
- Couriers and holiday closures are designed but not built (ER design §7).
