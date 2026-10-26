# features/inventory

## Purpose

Available quantities per variant: global by default, with optional pickup-location pools. An immutable ledger backs every nonzero change.

## Ownership and public API

- Owns `inventory.stock_levels`, `inventory.stock_movements`, `private.apply_stock_movement`, `private.resolve_stock_level`, `inventory.adjust_stock` and `inventory.variant_availability`.
- `index.ts` exports `StockLevelDto`, `StockMovementDto`, `MovementReason`, `adjustStockAction`, `listStockLevels`, `listMovements` and `getAvailability`.
- `StockLevelDto.scope` is `"global" | { pickupLocationId }`. Admin reads return Results after `inventory.manage`; availability returns only `{ variantId, isAvailable }` for visible catalog variants.
- Orders owns when reservations and releases happen. Reservation/release functions and the movement `order_id` column/FK are deferred to orders; order reasons are rejected until then.

## Invariants

- No API role, including service role, can write either table directly. Only the private writer changes stock. Anonymous callers cannot read quantities or the ledger.
- The writer locks the catalog variant before finding/creating a pool. Initial pool creation and concurrent set-to adjustments therefore serialize. A database constraint rejects negative stock, and ledger insertion shares the transaction with the quantity update.
- Admin adjustments call `inventory.adjust_stock` with a desired available quantity. SQL checks `inventory.manage`, derives `created_by` from `auth.uid()` and computes the delta under its lock. The caller cannot choose the actor or reason.
- Zero initializes an empty pool without a zero movement; repeated set-to requests append nothing. Pools are created lazily, and a missing tracked pool is unavailable.
- Pool resolution skips untracked variants; selects a pickup location's own row even when empty; otherwise selects global stock. Never fall back from an empty local pool to global.
- Movements are append-only. They have `created_at` only; mutable stock levels have `created_at` and `updated_at`.

## Server layout

- `server/stock`: repository factory over module functions, capabilities, mutation action and authorized admin queries.
- `server/availability`: anonymous repository and tagged cached query.
- `server/mutation`: Result conversion, inventory permission/cache constants and mutation runner.
- Pure selection/arithmetic and input schemas with field codes live in `domain/stock`; action failures in `domain/errors`.

## Cache and dependencies

`getAvailability` uses `'use cache'`, the anonymous client, a seconds lifetime and inventory/catalog tags. Successful inventory actions call `updateTag("inventory")`. Catalog changes invalidate its tag too. This is a display hint; orders must reserve against current SQL state. Reservations/releases will need inventory invalidation when orders is implemented.

Dependencies are access, catalog and fulfillment through their public APIs. Points of sale do not hold stock.

## Tests and deferred work

Unit tests cover pool selection, adjustment arithmetic and input codes. pgTAP covers shape, grants, all read policies by role, constraints and entry points. Integration exercises PostgREST adjustments, attribution, staff permission, no-ops, concurrency and anonymous scoped availability.

UI, reservation/release, order references and disabling location pools are deferred. Existing zero local pools remain selectable; deleting pools would conflict with their immutable ledger references. Decide a history-preserving disable design before exposing that action.

Catalog/fulfillment Result and cookie helpers remain duplicated until catalog UI PR #31 merges, per the inventory work-item sequencing requirement.
