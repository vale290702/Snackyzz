# features/cart

## Purpose
The shopper's cart: which variants and how many, kept in the browser between visits. No server state.

## Owns / does not own
- **Owns:** the client cart store, cart UI (drawer, line items, quantity controls) and the cart → checkout handoff.
- **Does not own:** prices, totals or stock truth. Display prices come from `catalog`; the binding total is computed by `orders.place_order`.

## Public API (`index.ts`)
- Domain: `CartLine` (`{ variantId, quantity }`), `cartReducer`, `cartSchema`
- Hooks: `useCart()` (lines, add/update/remove, counts), `useCartDrawer()` (open state, checkout handoff)
- UI: `CartProvider`, `CartDrawer`, `CartButton`

## Invariants
- The store holds **only** `{ variantId, quantity }`. Never prices or names, which go stale.
- Quantity is between 1 and 99 per line; one line per variant.
- Persisted under one versioned `localStorage` key (`snackyzz.cart.v1`). Parse with `cartSchema` on load; on failure, start empty. Never crash.
- Lines whose variant is archived or unavailable are shown as unavailable and excluded from checkout, not silently dropped.
- Implemented with `useSyncExternalStore` over `localStorage`, with no state library. Multiple tabs stay in sync via the `storage` event.

## Dependencies
`catalog` (types and the variant lookup for display).

## Testing
- Unit (TDD): reducer (add, set quantity, remove, clamp, merge), schema migration and corrupt-storage fallback.
- Component: drawer shows unavailable lines.

## Gotchas
- Server-render with an empty cart and hydrate on the client to avoid hydration mismatches.
- Wrap every `localStorage` access in try/catch (private mode, quota).
