# Snackyzz Rebuild — Decision Questionnaire

**Purpose.** Lock in the decisions that the rebuild depends on *before* any code is written: the database ER design, the directory structure (with a purpose file in each directory), and the guidelines agents follow when generating code.

**How to use it**

- Every question has an ID (`DB-07`), the **current state** where relevant, the options, and a **Recommended** default. Accept the recommendation by writing `✅ rec`, or write your own answer.
- Leave anything you're unsure about as `❓` — those become discussion items, not guesses.
- Once answered, each section turns into an artifact: `docs/rebuild/01-domain.md`, `02-er-design.md`, `03-architecture.md`, `04-structure.md`, root `AGENTS.md`, and ADRs under `docs/adr/`.
- Agents treat the answered file as the source of truth. Reference decisions by ID in commits and ADRs ("per DB-07").

**What exists today (inventory to preserve)**

| Area | Today |
|---|---|
| Storefront | Home, Shop (Snackyzz), Baking Stereo catalog, Sales points, About, Checkout, Success. Hash-based router inside a single Next.js page. Cart in `localStorage`. |
| Brands | `snackyzz` and `baking-stereo` — a text check constraint on `products.brand`; both brands share one order flow. |
| Checkout | Name/email/phone, mandatory SINPE receipt upload, fulfillment = pickup at sales point **or** messenger ("uber") delivery with zone fee + date + time slot, idempotency key + fingerprint. |
| Orders | `pending → confirmed / rejected`, confirmation comment, rejection reason, refund receipt upload, stock reserved on insert and restored on reject. |
| Admin | Supabase Auth + `admin_users` (no roles). Orders review, products (incl. stock, images), sales points, delivery zones, store settings (SINPE, delivery schedule, lead/slot hours), seasonal theme. |
| Notifications | Email outbox (claim/prepare/finish) to customers; Telegram admin alerts with linking, per-brand filter, pause, and confirm/reject *from Telegram* (drafts, webhook, dispatch). |
| Backend | Postgres RPCs (`security definer`) hold most logic; 7 Supabase Edge Functions (Deno); 1 Next API route (`telegram-dispatch`); Storage for receipts and product images. |
| Smells to fix | `create_order` dropped and re-created in 5 migrations; denormalized fulfillment fields on `orders`; enums as text checks scattered across migrations; singleton `store_settings` with JSONB schedule; 1,378-line `Admin.tsx`; two parallel outbox implementations; ad-hoc hand-written `types/database.ts`. |

---

## 1. Goals, scope & constraints

**G-01. What is the definition of "keep today's functionality"?**
Confirm the inventory table above is complete. Anything missing (hidden features, scripts, manual ops you do in the Supabase dashboard)?
**Answer:** Table looks complete

**G-02. What is explicitly *out of scope* for v1 of the rebuild?** (e.g. no new payment methods, no customer accounts)
**Answer:** Not more than we have right now, we'll end up in the same state as today. Changes are structural

**G-03. Rebuild strategy?**
- (a) Greenfield repo/branch, big-bang cutover
- (b) Same repo, new `apps/` structure, strangler migration feature by feature
- (c) Greenfield code, but keep the **same Supabase project** and migrate data in place
**Recommended:** (a) new code with (c) a one-time data migration script into a fresh schema, rehearsed on a Supabase branch. A strangler is not worth it at ~10k LOC.
**Answer:** ✅

**G-04. Must existing production data be migrated?** (orders history, receipts in Storage, products, admins, Telegram links)
**Answer:** We could remove the data if necessary, if migrating the data is low effort then we can do it

**G-05. Who works on this, and how?** Number of humans, which agents (Claude Code, Codex, both?), and whether agents work in parallel worktrees.
**Recommended:** assume multiple agents in parallel → strong module boundaries and per-directory docs matter more than usual.
**Answer:** 2 humans | Codex & Claude

**G-06. Timeline and success criteria.** What makes the rebuild "done"? (feature parity checklist, test coverage threshold, Lighthouse score, zero P1 bugs for N days)
**Answer:** All of it (everything from the bottom layer to the top layer should be readable using best practices, design, principles, easy to build on top of considering there could be some adjustments and features we could add based of the client needs etc), but no new feature

**G-07. Expected scale in 12 months?** Orders/day, number of brands, number of admins, number of locations. This decides how much we invest in multi-tenancy and queues.
**Answer:** This is for a local shop that'll start selling cookies, so we expect low volume for now

---

## 2. Domain & business rules

**DOM-01. Brands: is a brand a first-class entity?**
Today: hardcoded text values (`snackyzz`, `baking-stereo`) in checks, router, and Telegram filters.
- (a) Keep a fixed enum
- (b) `brands` table (name, slug, theme, logo, active) — products, notification filters, and routes reference it
- (c) Full multi-tenant: each brand has its own settings, SINPE, admins, orders
**Recommended:** (b). Shared order flow and admins, but brands are data, not code.
**Answer:** ✅ - Snackyzz will always be the main brand, but could do collabs with other branch and the system should support that

**DOM-02. Can a single order contain products from both brands?** (Today: yes.)
**Answer:** Yes

**DOM-03. Order lifecycle — confirm the full state machine.**
Today: `pending → confirmed | rejected`. Candidates to add: `cancelled` (by customer/admin), `ready_for_pickup`, `out_for_delivery`, `delivered`, `refunded`, `expired` (receipt never reviewed).
Which states and transitions are real? Who may trigger each one?
**Recommended:** model it as an explicit state machine (allowed transitions table/function + `order_status_history`), even if v1 only uses three states.
**Answer:** ✅ - And we could add some useful statuses

**DOM-04. Can a confirmed order be edited or cancelled afterwards?** What happens to stock and refunds?
**Answer:** Yes, could be cancelled, but not sure about editing at least not for now

**DOM-05. Payments.** SINPE only, with a manual receipt review?
- Will there ever be more payment methods (card, cash on pickup, bank transfer)?
- Is partial payment / a deposit possible?
**Recommended:** a `payments` table separate from `orders` (method, amount, status, proof file, reviewed_by), even if there's one payment per order today. This makes refunds a first-class record too.
**Answer:** ✅ For now just SINPE, but we could add some other payment methods in the future. Partial payments will not be possible for now

**DOM-06. Refunds.** Always the full amount? Is a refund always tied to a rejection, or can it happen after confirmation?
**Answer:** Always full amount for now. But, I see 2 flows where refunds could be executed, on order rejection or on order cancelled (after confirmed)

**DOM-07. Fulfillment methods.** Today: pickup at a sales point, or messenger delivery with zone + date + slot.
- Is "sales point" the same thing as "pickup location"? (Today one table serves both the public locations page and pickup.)
- Does pickup need a date/slot too?
- Will delivery providers vary (Uber, own messenger, courier)?
**Answer:** 1. 2. 3. Could vary, today we're thinking of using a local company to send the orders, but maybe we could decide using Uber Eats or some other messenger

**DOM-08. Delivery pricing.** Flat fee per zone today. Future: by distance, free over amount X, per-brand fees?
**Answer:** Flat fee per zone today. Could introduce some other variants in the future as the ones mentioned

**DOM-09. Delivery schedule.** Today: one weekly schedule (JSONB), lead hours, slot hours. Needed: holidays/closures, slot capacity limits, per-location schedules?
**Answer:** Same as today, we could consider per-location schedules

**DOM-10. Inventory.** Today: one `stock` integer per product, reserved on order, restored on rejection.
- Is stock per product only, or per product **per location**?
- Is there a need for a stock movement history (restocks, waste, adjustments)?
- Can products be made to order (no stock tracking)?
**Recommended:** `inventory_movements` ledger (append-only) with `products.stock` as a derived/cached value. It's auditable and fixes race conditions cleanly.
**Answer:** ✅
- I think each location should have their own stock, but this could be optional, might differ based on the location or if we want to track it
- Not a necessity today, but could be useful for tracking and traceability as recommended
- Yeah, I don't think that's a use case today, but would want to add


**DOM-11. Catalog structure.** Are variants needed (size, flavor, pack of 6 vs 12)? Categories/collections? Bundles? Price history?
**Answer:** Yes

**DOM-12. Customers.** Today: guest checkout only, contact data stored on the order.
- Will customers ever have accounts or order history?
- Should repeat customers be recognized (a `customers` table keyed by email/phone)?
**Recommended:** a `customers` table now (no auth), with orders referencing it. It's cheap and lets accounts come later.
**Answer:** ✅

**DOM-13. Admin roles.** Today: every admin can do everything.
Needed roles? (owner, order reviewer, catalog editor, per-brand admin)
**Recommended:** `roles` + `admin_roles` with permission checks in one SQL function; start with `owner` and `staff`.
**Answer:** ✅

**DOM-14. Notifications.** Channels today: customer email; admin Telegram.
- Future channels? (WhatsApp, SMS, admin email, push)
- Should customers get notifications for other states (out for delivery, ready)?
**Recommended:** one generic `notifications` outbox (channel, recipient, template, payload, status, attempts, next_attempt_at) that replaces both `email_outbox` and `telegram_deliveries`.
**Answer:** ✅ Sounds good. Also, Telegram integration was WIP, so any changes considered for it could be done with no problems

**DOM-15. Seasonal themes.** Stay a global setting, become per-brand, or get scheduling (auto-activate on date ranges)?
**Answer:** I think for now it will be a global setting with manual activation, but could change to become per-brand and with scheduling. Also, today we're thinking of seasonal themes, but maybe in the future we could add other themes like Aniversary, Movie-related theme, etc

**DOM-16. Languages & currency.** UI is Spanish, money is integer colones (CRC). Is English or USD ever needed? Is tax (IVA) shown or calculated?
**Answer:** Not for now. But we should use locale (next-intl) so localizations live in one place and it's easy to add a new one

**DOM-17. Glossary.** Agree on one name per concept, in English, for code (UI copy stays in Spanish). Confirm or correct:
`Order`, `OrderItem`, `Payment` (SINPE proof), `Refund`, `Fulfillment` (pickup | delivery), `Location` (sales point), `DeliveryZone`, `DeliverySlot`, `Brand`, `Product`, `Customer`, `Admin`, `Notification`, `SeasonalTheme`.
**Answer:** SeasonalTheme could be just a more generic one considering DOM-15 answer

---

## 3. Architecture & stack

**ARC-01. Keep Next.js + Supabase + Vercel?**
**Recommended:** yes. The stack is fine; the problem is how it's used.
**Answer:** ✅

**ARC-02. Routing.** Today: a hash router inside one Next page (`#shop`, `#admin`), so there's no SSR/SEO per page and no route-level code splitting.
**Recommended:** real App Router routes (`/`, `/tienda`, `/baking-stereo`, `/checkout`, `/admin/orders` …), with route groups `(store)` and `(admin)` and a separate admin layout.
**Answer:** ✅

**ARC-03. URL language.** Spanish (`/tienda`, `/pedidos`) or English (`/shop`, `/orders`) slugs?
**Answer:** English

**ARC-04. Where does business logic live?** This is the most important architecture decision.
Today it's split across Postgres RPCs, Edge Functions, a Next API route, and client hooks.
- (a) **Database-centric:** RPCs + triggers own the rules; the app is thin
- (b) **App-centric:** a TypeScript domain layer (Next server actions / route handlers) owns the rules; the DB enforces integrity only (constraints, RLS, FKs)
- (c) **Hybrid with a clear rule:** invariants that need atomicity (stock reservation, idempotent order creation, state transitions) live in SQL; orchestration, validation, side effects (email, Telegram, storage) live in TypeScript
**Recommended:** (c), written down as a rule agents can apply mechanically.
**Answer:** ✅

**ARC-05. Edge Functions vs Next server code.** Keep Deno Edge Functions, or move everything server-side into Next (server actions + route handlers) and use Supabase only as DB/Auth/Storage?
**Recommended:** consolidate into Next (one runtime, one language toolchain, shared types and validation). Keep Edge Functions only for things that must run inside Supabase (DB webhooks, cron, if not handled elsewhere).
**Answer:** ✅

**ARC-06. Background jobs (outbox dispatch, retries, expiring drafts).**
- (a) Supabase `pg_cron` + `pg_net`
- (b) Vercel Cron hitting a route handler
- (c) A queue (`pgmq`, Inngest, Trigger.dev)
**Recommended:** (a) `pg_cron` + `pgmq`/outbox table and one dispatcher endpoint — no extra vendor.
**Answer:** ✅

**ARC-07. Data access from TypeScript.**
- (a) `supabase-js` with generated types
- (b) Drizzle/Kysely over a direct Postgres connection, server-only
- (c) Mixed: `supabase-js` in the browser for public reads; a typed query layer on the server
**Recommended:** (a) with `supabase gen types` committed and regenerated in CI. All access goes through a repository module per aggregate (no `supabase.from()` calls scattered in components).
**Answer:** ✅

**ARC-08. Validation & contracts.** One schema library shared across forms, server actions, and edge/route handlers?
**Recommended:** Zod (or Valibot) schemas in the domain layer, so types are inferred from schemas rather than hand-written.
**Answer:** ✅

**ARC-09. Client state.** Cart in `localStorage` today; admin data in custom hooks.
**Recommended:** server components + server actions for data; TanStack Query only where live client refetching is needed (admin order queue); the cart stays client-side in a small store (Zustand or `useSyncExternalStore`), validated against the server at checkout.
**Answer:** ✅

**ARC-10. Styling.** Today: one global `styles.css` plus feature CSS.
- (a) CSS Modules + design tokens as CSS variables
- (b) Tailwind v4 with tokens in `@theme`
- (c) Keep global CSS
**Answer:** Tailwind

**ARC-11. Component library.** Build in-house primitives, or use headless primitives (Radix / React Aria) + own styling? Storybook/Ladle for isolated component development?
**Answer:** Shadcn

**ARC-12. Monorepo?** One Next app today. Will there be a second app (separate admin app, mobile, Telegram bot service)?
**Recommended:** single app, but structured so `admin` could be split out later. No monorepo tooling until there's a second deployable.
**Answer:** ✅

**ARC-13. Architectural style for the code.**
- (a) Layered (ui / services / data)
- (b) Feature-sliced / vertical slices (each feature owns its UI, actions, queries, tests)
- (c) Hexagonal/clean (domain core + ports/adapters) per feature
**Recommended:** (b) vertical slices with a thin hexagonal touch: a pure `domain/` per feature (no I/O, fully unit-tested), with `server/` adapters for DB/email/Telegram. Avoid full ceremony (no interfaces with one implementation unless it's a test seam).
**Answer:** ✅

---

## 4. Database ER design

**DB-01. Schema layout.**
- (a) Everything in `public`
- (b) `public` exposes only views/RPCs meant for the API; tables live in a private schema (`app`, `private`)
- (c) Schema per domain (`catalog`, `ordering`, `notifications`)
**Recommended:** (b) or (c) + an exposed `api` schema. This keeps PostgREST from accidentally exposing internal tables.
**Answer:** ✅ I like Schema per domain

**DB-02. Naming conventions.** Confirm: `snake_case`, **plural** table names, singular column names, FKs as `<entity>_id`, timestamps as `<verb>_at`, booleans as `is_/has_`, indexes `<table>_<cols>_idx`, constraints `<table>_<col>_<type>`.
**Answer:** ✅

**DB-03. Primary keys.**
Today: mixed — `products.id` is text, others are uuid v4, some are identity bigints.
- (a) `uuid` v7 everywhere (time-ordered, index-friendly)
- (b) `bigint identity` internal + `uuid` public id
- (c) Mixed by table
**Recommended:** (a) uuid v7 for everything, plus a human-friendly `order_number` (sequence, e.g. `SNK-000123`) for orders, which customers and admins will quote.
**Answer:** ✅

**DB-04. Money.** Today: `integer` colones.
**Recommended:** `bigint` minor units + a `currency char(3)` column (or a `money_amount` domain), never `numeric` floats in app code. Confirm whether colones have céntimos in practice.
**Answer:** Colones doesn't have céntimos

**DB-05. Enumerations.** Today: `text` + `check (... in (...))` repeated across migrations.
- (a) Postgres `enum` types
- (b) Lookup tables with FK (`order_statuses`)
- (c) `text` + named check constraint
**Recommended:** (a) for closed, stable sets (order_status, fulfillment_method); (b) when admins can add values or values carry attributes.
**Answer:** ✅

**DB-06. Standard columns on every table?** `id`, `created_at`, `updated_at` (trigger-maintained), `created_by`/`updated_by` where an admin acts.
**Answer:** ✅

**DB-07. Deletion policy.** Hard delete, soft delete (`deleted_at`), or archive (`is_active`/`archived_at`)?
Today: `active` booleans on products/locations/zones.
**Recommended:** `archived_at timestamptz` for catalog/config entities (keeps FKs valid for historical orders); never delete orders/payments; hard delete only for ephemeral data (link challenges, drafts).
**Answer:** ✅

**DB-08. Order snapshots.** An order must keep prices, names, brands, and addresses as they were at purchase time.
**Recommended:** keep snapshot columns on `order_items` (name, unit_price, brand_id) and a separate `order_fulfillments` row (method, location_id, zone_id, fee, address, date, slot_start, slot_end, label snapshot) instead of 10 nullable columns on `orders`.
**Answer:** ✅

**DB-09. Fulfillment modeling (polymorphism).**
- (a) One `order_fulfillments` table with nullable method-specific columns + check constraints per method
- (b) Table-per-method (`order_pickups`, `order_deliveries`) with a 1:1 to orders
**Recommended:** (a) with strict `CHECK` constraints that enforce which columns are required per method.
**Answer:** We'll end up with a common pattern of null fields based on the order type, shouldn't option B be the most normalized and better design?

**DB-10. State history & audit.**
Today: `order_decision_audit` only for decisions; status overwritten in place.
**Recommended:** `order_events` (append-only: order_id, type, from_status, to_status, actor_type [customer/admin/system], actor_id, source [web/telegram/system], payload jsonb, created_at). It doubles as the audit log and the trigger source for notifications.
**Answer:** ✅

**DB-11. Settings modeling.** Today: a singleton `store_settings` row with a JSONB weekly schedule.
**Recommended:** typed tables: `store_settings` (kept as singleton, or per brand per DOM-01), `business_hours` (location/brand, weekday, opens_at, closes_at), `closures` (date ranges). JSONB only for truly unstructured data.
**Answer:** ✅

**DB-12. Files.** Today: `receipt_path`, `refund_receipt_path`, `products.image` as text paths.
**Recommended:** a `files` table (bucket, path, mime, size, sha256, uploaded_by, created_at) referenced by FK from payments/refunds/products. This enables validation, dedupe, and orphan cleanup.
**Answer:** ✅

**DB-13. Idempotency.** Keep `idempotency_key + fingerprint` on orders, or a generic `idempotency_keys` table usable by any mutation (order creation, admin decisions, Telegram callbacks)?
**Answer:** What do you think is the most recommended option, based on best practices, principles and patterns?

**DB-14. Notification outbox design** (see DOM-14). Confirm the generic shape: `notifications(id, channel, recipient, template, payload, status, attempts, next_attempt_at, locked_at, last_error, provider_message_id, dedupe_key unique)`.
**Answer:** Looks ok, but should we consider using OOP for this? There could be different ways of sending out notifications. Today only email and Telegram in mind, but we could consider some other providers, e.j. WhatsApp, SMS, etc. What's the best structure/design we could think for this?

**DB-15. Telegram tables.** Today: 6 tables (admins, link challenges, events, deliveries, updates, drafts). Fold into generic tables (`admin_channels`, `notifications`, `inbound_webhooks`, `conversation_drafts`) or keep Telegram-specific?
**Answer:** I like generic if we have the same vision as DB-14

**DB-16. RLS strategy.**
**Recommended:** RLS on every table, default deny; anon gets read only on published catalog/locations/zones via views; all writes through RPCs or server code using the service role; one `authorize(permission)` SQL function; every policy has a pgTAP test.
**Answer:** ✅

**DB-17. Triggers vs explicit calls.** Today: triggers reserve stock, snapshot brands, and enqueue Telegram events — which makes behavior implicit.
**Recommended:** triggers only for mechanical concerns (`updated_at`, audit/events append); business effects happen in explicit RPCs/services.
**Answer:** ✅

**DB-18. Migrations workflow.**
- (a) Imperative migrations only (today)
- (b) Supabase declarative schema (`supabase/schemas/*.sql`) + generated migrations
**Recommended:** (b): one file per table/function in `supabase/schemas/`, with diffs generated into migrations. No more `drop function create_order` five times.
**Answer:** ✅

**DB-19. Database testing.** Today: ad-hoc SQL test files plus a Deno test.
**Recommended:** pgTAP via `supabase test db` for constraints, RLS, and RPCs; runs in CI against a local stack.
**Answer:** ✅

**DB-20. Seed data.** Deterministic seed (`supabase/seed.sql`) with demo brands, products, zones, admin user? Separate from prod data?
**Answer:** ✅

**DB-21. PII & retention.** How long do we keep customer names/phones/addresses and receipt images? Any need for "delete my data" requests?
**Answer:** We'll keep stored for now, we can consider this for later

**DB-22. Reporting.** Will admins need sales reports (by day, brand, product, zone)? If yes: SQL views now, a materialized view or analytics export later.
**Answer:** Yes, we should consider this

---

## 5. Directory structure & per-directory docs

**DIR-01. Top-level layout.** Proposed (adjust):

```
/
├─ AGENTS.md                 # root rules for every agent (CLAUDE.md → @AGENTS.md)
├─ docs/
│  ├─ adr/                   # architecture decision records (0001-*.md)
│  ├─ domain/                # glossary, state machines, business rules
│  └─ rebuild/               # this questionnaire + outputs
├─ src/
│  ├─ app/                   # Next routes ONLY: thin pages/layouts that compose features
│  │  ├─ (store)/
│  │  ├─ (admin)/admin/
│  │  └─ api/                # webhooks & cron endpoints only
│  ├─ features/              # vertical slices: catalog, cart, checkout, orders, fulfillment,
│  │  └─ <feature>/          #   inventory, locations, notifications, settings, themes, auth
│  │     ├─ AGENTS.md
│  │     ├─ domain/          # pure types, schemas, rules (no I/O)
│  │     ├─ server/          # actions, queries, repositories (server-only)
│  │     ├─ ui/              # components for this feature
│  │     └─ index.ts         # public API of the feature
│  ├─ shared/                # cross-feature, domain-agnostic
│  │  ├─ ui/                 # design-system primitives
│  │  ├─ lib/                # money, dates/tz, result, errors, logger
│  │  └─ config/             # env parsing (validated)
│  └─ integrations/          # supabase, email provider, telegram, storage clients
├─ supabase/
│  ├─ schemas/               # declarative schema, one file per object
│  ├─ migrations/            # generated
│  ├─ tests/                 # pgTAP
│  └─ seed.sql
└─ tests/
   └─ e2e/                   # Playwright, cross-feature journeys
```

**Answer:**

**DIR-02. Feature boundaries.** Can features import each other?
**Recommended:** only through `features/<x>/index.ts`; `domain/` never imports `server/` or `ui/`; `shared/` never imports `features/`. Enforce with `eslint-plugin-boundaries` or `dependency-cruiser` in CI.
**Answer:** ✅

**DIR-03. Test colocation.** Unit tests next to the code (`*.test.ts`) or in a top-level `tests/`?
**Recommended:** colocated unit/integration tests; top-level only for e2e.
**Answer:** ✅

**DIR-04. Per-directory doc file name.** `AGENTS.md` (read automatically by Codex and Claude via nested CLAUDE.md → @AGENTS.md) or `README.md` (human-first)?
**Recommended:** `AGENTS.md` in each feature and top-level dir; `README.md` only at root for humans.
**Answer:** ✅

**DIR-05. Per-directory doc template.** Confirm the sections each one must have:
1. **Purpose** — one paragraph: what this directory owns
2. **Owns / does not own** — explicit boundaries
3. **Public API** — what other modules may import
4. **Key invariants / business rules** — with links to `docs/domain`
5. **Dependencies** — allowed imports
6. **How to test** — commands, fixtures
7. **Gotchas** — non-obvious things that bit us before
Max ~80 lines; it links out instead of duplicating.
**Answer:**  ✅

**DIR-06. Keeping docs fresh.** Should a PR that changes a feature's public API or invariants be required to update its `AGENTS.md`? (A CI check or PR template checkbox.)
**Answer:** ✅

**DIR-07. Naming conventions.** Files `kebab-case.ts`, components `PascalCase` exports, hooks `use-*.ts`, server-only files suffixed or placed in `server/` with `import "server-only"`?
**Answer:** ✅

**DIR-08. Barrel files.** Only one `index.ts` per feature (its public API), no deep barrels?
**Answer:** ✅

---

## 6. Agent guidelines (root `AGENTS.md`)

**AG-01. Guiding principles — rank them** (they conflict; ranking resolves conflicts):
Correctness & data integrity · Security · Simplicity (KISS/YAGNI) · Readability · Testability · Performance · DRY · Extensibility
**Recommended order:** Correctness > Security > Simplicity > Readability > Testability > Performance > Extensibility > DRY (duplication beats the wrong abstraction).
**Answer:** ✅

**AG-02. Design principles to state explicitly.** Pick the ones agents must apply:
- [x] Deep modules: small interfaces hiding real complexity (Ousterhout)
- [x] Functional core, imperative shell (pure domain, I/O at the edges)
- [x] Parse, don't validate (validate at boundaries into typed values)
- [x] Make illegal states unrepresentable (discriminated unions, DB constraints)
- [x - Important] SOLID, pragmatically (SRP and DIP at seams, not interface-per-class)
- [x] Composition over inheritance
- [x] Explicit over implicit (no magic triggers or global side effects)
- [x] Rule of three before abstracting
**Answer:** All

**AG-03. Hard limits agents must respect?** e.g. file ≤ 300 lines, function ≤ 50 lines, component ≤ 150 lines, max 3 levels of JSX nesting before extracting, no `any`, no non-null `!` without a comment.
**Answer:** ✅

**AG-04. TypeScript strictness.** `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`?
**Recommended:** all on.
**Answer:** ✅

**AG-05. Error handling convention.**
- (a) Throw exceptions, catch at boundaries
- (b) `Result<T, E>` return values in domain/server code, exceptions only for bugs
**Recommended:** (b) for expected failures (validation, out of stock, invalid transition) with typed error codes mapped to Spanish UI messages in one place; throw for programmer errors.
**Answer:** ✅

**AG-06. Logging & observability.** Axiom is connected. Structured logs (JSON, request id, order id) from server code and Edge Functions? Error tracking (Sentry)? Which events must always be logged?
**Answer:** We should make sure to log every step on the way for server actions, but we've not considered Axiom or other provider for now, this will be kept for a future iteration

**AG-07. Testing requirements per change.**
**Recommended:** domain logic → unit tests required; server actions/RPCs → integration test against local Supabase; RLS/policies → pgTAP; user journeys (checkout, admin confirm/reject) → Playwright. TDD for domain code. No merging with skipped tests.
**Answer:** ✅

**AG-08. Definition of Done for an agent task.** Proposed: typecheck, lint, unit + db tests pass; new behavior has tests; touched directory's `AGENTS.md` updated if needed; no new TODOs without an issue link; migration generated from declarative schema; screenshots for UI changes.
**Answer:** ✅

**AG-09. What agents must NEVER do?** Proposed: edit generated migrations by hand; use the service role key client-side; disable RLS; bypass `features/*/index.ts`; add a dependency without stating why; commit secrets; change DB schema without an ADR for non-trivial changes; write UI copy in English.
**Answer:** ✅

**AG-10. When should an agent stop and ask instead of deciding?** e.g. schema changes, new dependencies, changes to money/stock/order-state logic, anything touching auth/RLS.
**Answer:** ✅ - but always include a recommendation

**AG-11. ADRs.** Required for which decisions? Template (context, decision, alternatives, consequences)? Who approves?
**Answer:** Refactors, changes in design, complex features, etc. I could approve

**AG-12. Dependencies policy.** Allowed vs banned libraries; prefer platform APIs; max bundle impact for storefront pages?
**Answer:** ✅

**AG-13. Comments & docs in code.** Comments explain *why*, not *what*; JSDoc only on public APIs of features/shared?
**Answer:** JSDocs with include @ tags. Always short and concise. Avoid multi-paragraphs, too technical descriptions and code references

**AG-14. Commits & PRs.** Conventional Commits? Branch naming (`feat/`, `fix/`, `codex/`, `claude/`)? PR size limit? Required reviewers? Squash merge?
**Answer:** No, agent prefixes, prefer action branches like feat/, fix/ or refactor/. No need for PR size limit, no need for required reviewers for now, squash merge

**AG-15. Agent-specific files.** Keep `CLAUDE.md` as `@AGENTS.md` only, so Codex and Claude share one source? Add skills/commands for repeated tasks (new feature scaffold, new migration, new notification template)?
**Recommended:** yes, single source in `AGENTS.md`; add scaffolding skills once patterns stabilize.
**Answer:** ✅

---

## 7. Quality, security & operations

**Q-01. CI pipeline.** typecheck → lint → format check → unit → db tests (local Supabase) → build → e2e on preview deploy? Required to pass before merge?
**Answer:**typecheck → lint → format check → unit → build. DB check and e2e for local testing. No need for required before merge

**Q-02. Pre-commit hooks** (lefthook/husky + lint-staged)? Or CI only?
**Answer:** Include pre-commit hooks

**Q-03. Environments.** local → preview (Vercel preview + Supabase branch) → production? Is a staging environment needed?
**Answer:** Might be nice to have a separate staging env, but is it free in the current stack?

**Q-04. Secrets & config.** All env vars parsed and validated at startup (one `env.ts` with Zod); server-only secrets never prefixed `NEXT_PUBLIC_`?
**Answer:** Yes to both

**Q-05. Admin authentication.** Email+password today? Require MFA, magic link, or Google sign-in? Session length?
**Answer:** Email+password for now. Should include a session length limit, but what's the recommended? 1 week?

**Q-06. Upload security.** Receipt rules: max size, allowed MIME (jpg/png/webp/pdf?), image re-encoding/stripping EXIF, signed upload URLs, private bucket with short-lived signed read URLs?
**Answer:** ✅

**Q-07. Abuse protection.** Rate limiting on checkout and uploads? Bot protection (Turnstile)? Telegram webhook secret verification (exists today, keep)?
**Answer:** ✅. Also, Telegram integration was WIP, but we could redesign and think of a better approach/integration if necessary

**Q-08. Accessibility & performance targets.** WCAG 2.2 AA? Lighthouse ≥ 90 on storefront? Core Web Vitals budgets?
**Answer:** WCAG 2.2 AA if low effort. Other 2 could be considered but not main priorities

**Q-09. Design system.** `DESIGN.md` and `.impeccable/` exist. Do they carry over as-is, or get turned into tokens + primitives in `shared/ui` first?
**Answer:** get turned into tokens + primitives

**Q-10. Backups & recovery.** Supabase PITR enabled? Storage backups? A documented restore drill?
**Answer:** Could be considered but not main priority

**Q-11. Cutover plan.** Downtime window acceptable? How are in-flight `pending` orders handled during the switch? What's the rollback plan?
**Answer:**Downtime window is acceptable

**Q-12. Feature flags.** Needed for gradual rollout (e.g. new checkout), or is the cutover all at once?
**Answer:** Not for now, it'll be a cutover all at once

---

## 8. Open questions from you

Anything this questionnaire missed that you already know will matter:

**Answer:**
