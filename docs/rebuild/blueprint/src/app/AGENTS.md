# src/app

## Purpose
Next.js App Router routes: URLs, layouts, metadata, loading/error boundaries. Pages are **thin**: they read params, call feature queries, and compose feature UI.

## Owns / does not own
- **Owns:** the route tree, layouts, `metadata` / `generateMetadata`, `loading.tsx` / `error.tsx` / `not-found.tsx`, and the two Route Handler families (`api/webhooks/[channel]`, `api/jobs/[job]`).
- **Does not own:** business logic, data access, or reusable components. Those live in `features/*` and `shared/ui`.

## Route map (English slugs, ARC-03)
| Group | Routes |
|---|---|
| `(store)` | `/` · `/shop` · `/brands/[slug]` · `/where-to-buy` (retail points of sale + Snackyzz pickup locations) · `/about` · `/checkout` · `/orders/[number]/placed` |
| `(admin)/admin` | `/admin/sign-in` · `/admin/orders` · `/admin/orders/[id]` · `/admin/catalog` · `/admin/inventory` · `/admin/fulfillment` · `/admin/points-of-sale` · `/admin/settings` · `/admin/notifications` · `/admin/team` · `/admin/reports` |
| `api` | `POST /api/webhooks/[channel]` · `POST /api/jobs/[job]` |

## Rules
- A `page.tsx` is ≤ ~40 lines: `await params`, call queries from a feature's `index.ts`, render feature components. Logic beyond that belongs in a feature.
- Import features **only** through `@/features/<x>` (their `index.ts`). Never import `integrations/*` here.
- The admin layout calls `getAdmin()` and renders `AdminShell`; each admin page still relies on its feature query calling `requirePermission`, because layouts don't guard Server Actions.
- Route Handlers are the **composition root**: they wire features together explicitly, with no module-level registration.
  - `api/webhooks/[channel]` → `messaging.handleWebhook(channel, request, adminChatInboundHandler)`.
  - `api/jobs/events` → verify `JOB_SECRET` → `events.runEventConsumers([notificationsConsumer])` → `messaging.runOutboundDispatcher()`.
  - `api/jobs/cleanup` → each feature's cleanup function. Unknown `channel`/`job` → 404.
- Every route has Spanish metadata through next-intl (`getTranslations` in `generateMetadata`).
- Public pages rely on cached feature queries (`'use cache'`). Admin pages are dynamic.

## Dependencies
`features/*` (index only), `shared/ui`, `i18n`.

## Testing
Covered by feature tests and `tests/e2e`. Pages have no unit tests of their own; if a page needs one, move the logic into a feature.

## Gotchas
- `params` and `searchParams` are Promises in Next 16; `await` them.
- `proxy.ts` (not middleware) is at `src/proxy.ts` and only performs the optimistic `/admin` redirect.
