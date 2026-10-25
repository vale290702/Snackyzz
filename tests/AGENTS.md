# tests

## Purpose

Cross-feature end-to-end journeys (Playwright) and shared fixtures. Unit and integration tests are **not** here; they sit next to the code they test (DIR-03).

## Owns / does not own

- **Owns:** `e2e/*.spec.ts`, `fixtures/` (images such as a valid/invalid SINPE proof, data factories), Playwright config helpers.
- **Does not own:** feature unit/integration tests (`*.test.ts`, `*.int.test.ts` beside the source) or pgTAP (`supabase/tests`).

## Journeys that must always have a spec

1. Browse shop → add variants → checkout with **pickup** → proof upload → "order received".
2. Same with **delivery** (zone fee + window).
3. Checkout blocked without a proof; blocked when checkout is closed.
4. Admin signs in → confirms an order → customer email queued.
5. Admin rejects with a reason and refund proof → stock restored.
6. Admin cancels a confirmed order → refund required.
7. Staff cannot reach catalog management.
8. Theme switch changes the storefront.
9. "Where to buy" lists points of sale and pickup locations separately; checkout offers only pickup locations.
10. Pickup at a location with its own stock reserves there; without it, from global stock.
11. **Telegram MVP:** order placed → linked admin's alert queued → tap Confirmar → order confirmed, alert edited for every admin, customer email queued.
12. **Telegram reject:** tap Rechazar → reason → refund proof photo → review → order rejected with reason, stock restored.
13. Linking a Telegram account (deep-link token + web approval); a stale button after re-linking does nothing.

## Rules

- Run against `supabase start` + `npm run dev`, with `seed.sql` loaded. Reset the DB between files (`supabase db reset`) or isolate with unique data.
- Select elements by role and accessible name (`getByRole("button", { name: "Confirmar" })`), never CSS classes. This doubles as an accessibility check.
- No fixed sleeps; wait on visible state.
- Outbound email/Telegram use fake channel adapters in test mode; assert on `messaging.outbound_messages` rows. Telegram updates are simulated by POSTing fixture payloads to `/api/webhooks/telegram`.

## Commands

`npm run test:e2e` · `npx playwright test e2e/checkout.spec.ts --ui`

## Media fixtures

`fixtures/media/` contains synthetic images: a 4032×3024 JPEG, a 4096×4096 JPEG exceeding the pixel ceiling, and small PNG/WebP images. Media unit/integration tests remain colocated under the feature. No media e2e is added until checkout/order review provides a journey.

## Gotchas

- Delivery windows depend on "now"; tests set the clock with Playwright's `page.clock`.
