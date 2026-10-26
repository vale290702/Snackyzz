# 0012: Inventory pools and atomic movement ledger

- Status: proposed
- Approver: Alejandro Loaiza
- Date: 2026-10-25

## Context

Orders needs a single stock writer before reservations are implemented. Tracked variants use global stock by default, with optional pickup-location pools. Admins set an available quantity; concurrent requests must not create duplicate pools or lose ledger changes.

## Decision

Implement ER §8 in schema `inventory`. A unique nulls-not-distinct constraint identifies each pool. Only `private.apply_stock_movement` writes pools and movements; API roles, including service role, have no table writes. The writer locks the variant before pool initialization and quantity arithmetic, serializing changes for that variant. A nonnegative quantity check and nonzero movement check protect the transaction. Immutable movement records retain the responsible admin and creation time.

Pools initialize lazily, including zero pools without zero movements. SQL computes set-to deltas after locking, making repeated targets no-ops. `inventory.adjust_stock` authorizes `inventory.manage` and derives its actor from the session. Public availability exposes only booleans for visible catalog variants, selecting a local pool even at zero before falling back to global. The display query uses brief caching with inventory and catalog tags; checkout must reserve against SQL state.

Orders will add the order reference/FK and reservation/release functions. Until then, a constraint rejects order movement reasons. Pool disabling is deferred because deleting a historical pool would break immutable ledger references. It needs an explicit history-preserving design before becoming an entry point.

## Alternatives

- Lock only existing stock rows: cannot serialize concurrent first initialization without additional conflict/retry handling.
- Direct table writes with RLS: permits ledger/quantity divergence and violates the stock write boundary.
- Create pools in catalog triggers: introduces business side effects in another feature's write path.
- Delete zero pools: conflicts with their immutable ledger references.

## Consequences

One transaction updates available stock and appends its movement. Changes to different pools of one variant serialize; this is appropriate for the shop's volume. Missing tracked pools are unavailable. Catalog owns tracking status, inventory owns quantities, and orders will own reservation timing and inventory-cache invalidation after order changes. No new dependency is required.
