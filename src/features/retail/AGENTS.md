# features/retail

## Purpose

Points of sale: third-party places (local stores, supermarkets, cafés…) where customers can buy Snackyzz products off the shelf. Feeds the public "Where to buy" page. Informational only.

## Owns / does not own

- **Owns:** schema `retail` (points_of_sale, point_of_sale_brands), the points-of-sale section of "Where to buy", and admin management (`/admin/points-of-sale`).
- **Does not own:** Snackyzz pickup locations (`fulfillment`). Nothing here is used in checkout, orders or inventory.

## Public API (`index.ts`)

- Types: `PointOfSaleDto`, `PointOfSaleKind`
- Server: `listPointsOfSale()` (cached, tag `retail`), `savePointOfSaleAction`, `archivePointOfSaleAction`
- Hooks: `usePointOfSaleFilters(points)` (filter by city/brand), `usePointOfSaleEditor(point?)`
- UI: `PointOfSaleList`, `PointOfSaleCard`, admin `PointOfSaleManager`

## Invariants

- A point of sale is **never** a pickup location and is never referenced by orders or stock. If a store becomes a Snackyzz-run pickup spot, create a `fulfillment.pickup_locations` row instead.
- Hours are free text (`hours_note`); we don't run these stores and never compute with their hours.
- No `point_of_sale_brands` rows = carries the primary brand only.
- Archived points disappear from the public page.

## Dependencies

`catalog` (brand types and names), `access` (`retail.manage`).

## Testing

- Unit: filter logic in the hook's `domain/` helpers.
- Integration: owner can save/archive; staff denied; anon sees only non-archived rows.

## Gotchas

- Call `updateTag("retail")` after admin mutations.
- Map links are user-entered; render them with `rel="noopener noreferrer"` and validate `https://`.
