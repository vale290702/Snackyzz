# Rebuild Decision Log

The decisions from [00-questionnaire.md](00-questionnaire.md). Every other rebuild doc cites the IDs below.

**Source column**
- **Answered**: the team's answer (✅ = took the recommendation).
- **Recommended**: the team asked for a recommendation; the reasoning is in the linked doc.
- **Default**: left blank, so the Recommended option was applied.

To change a decision, edit this file and every doc that cites it in the same PR.

## Guiding constraints

1. **Structural change, functional parity** (G-02, G-06). v1 ships today's behavior. When an answer asks for something new (variants, cancellations, reports…), the rule is:
   - **Build now** anything that changes core keys or relationships. It's expensive to retrofit (e.g. variants change what an order line points to).
   - **Design now, build later** anything additive (e.g. bundles, theme scheduling). The extension point is documented and nothing more is built.
   - The split for each item is in [Scope split](#scope-split).
2. **Low volume** (G-07). Pick the simplest design that stays correct. No queues, multi-tenancy or caching layers beyond what Postgres and Next provide.
3. **Two humans, Claude Code and Codex in parallel** (G-05). Module boundaries and per-directory `AGENTS.md` files are first-class deliverables.

## 1. Goals

| ID | Decision | Source |
|---|---|---|
| G-01 | The questionnaire's inventory table is the parity checklist. | Answered |
| G-02 | No new features; the changes are structural. | Answered |
| G-03 | Greenfield code, big-bang cutover, fresh schema, one-time data migration rehearsed beforehand. All rework happens on the `rework` integration branch (G-08). | Answered ✅ |
| G-04 | Migrate only what's low-effort: catalog, locations, zones, settings, admins. Order history is not migrated; pending orders are resolved before cutover. | Answered |
| G-05 | 2 humans; Claude Code and Codex. | Answered |
| G-06 | Done = every layer readable and easy to extend, plus the parity checklist passes. | Answered |
| G-07 | Low volume local shop. | Answered |
| G-08 | Integration branch **`rework`**, cut from `main`. Work items branch off `rework` and merge back into it (squash). When the rework is ready, one PR merges `rework` into `main` (merge commit). `main` is merged into `rework` whenever it changes. | Answered |

## 2. Domain

| ID | Decision | Source |
|---|---|---|
| DOM-01 | `catalog.brands` table. Exactly one **primary** brand (Snackyzz); collab brands are rows. Brand copy (title, tagline, label) moves from code into the table. | Answered ✅ |
| DOM-02 | One order can mix brands. | Answered |
| DOM-03 | Explicit state machine, transitions table, `order_events` history. Adds `ready_for_pickup`, `out_for_delivery`, `completed`, `cancelled`. See [order lifecycle](blueprint/docs/domain/order-lifecycle.md). | Answered ✅ |
| DOM-04 | Orders can be cancelled (including after confirmation), not edited. | Answered |
| DOM-05 | `orders.payments` separate from orders. SINPE Móvil only; one full payment per order. | Answered ✅ |
| DOM-06 | Full refunds only, recorded on **reject** (payment had arrived) or **cancel** (after confirmation). | Answered |
| DOM-07 | Fulfillment = `pickup` (at a **Snackyzz pickup location**) or `delivery`. Third-party **points of sale** are a separate, informational concept (`retail`), never used in checkout (F-4). Pickup has no date/slot (parity). Courier may change: modeled as a future `fulfillment.couriers` table (design only). | Answered |
| DOM-08 | Flat fee per delivery zone. Other pricing rules can be added later behind a `DeliveryPricing` domain function. | Answered |
| DOM-09 | Same weekly delivery schedule, stored as rows (`delivery_hours`). Per-pickup-location hours supported (`pickup_location_hours`). | Answered |
| DOM-10 | Ledger (`stock_movements`) + cached levels (`stock_levels`). Stock is **global by default**; a pickup location may optionally have its own row per variant, otherwise orders use global stock (F-4). Made-to-order variants (`is_stock_tracked = false`) aren't tracked. Rule in [ER design §8](02-er-design.md#8-inventory). | Answered ✅ |
| DOM-11 | Categories, variants and price history in v1 schema. Bundles designed only. | Answered (see Scope split) |
| DOM-12 | `orders.customers` (no auth), keyed by email. Orders also snapshot contact data. | Answered ✅ |
| DOM-13 | `owner` and `staff` roles as an enum on `access.admins`, with one SQL permission map. All current admins become `owner`. | Answered ✅ (simplified: no `admin_roles` join table at this scale) |
| DOM-14 | Telegram is the **admin bot**: the MVP use case is receive order → Confirm / Reject from the bot (F-5). Step 2 adds summaries and commands; step 3 (post-MVP) an AI agent. Built from four channel-agnostic modules: `events`, `messaging`, `notifications`, `admin-chat`. | Answered ✅ |
| DOM-15 | A generic **Theme** concept (`seasonal`, `anniversary`, `campaign`…). v1: one global, manually activated theme. Per-brand themes and scheduling are design only. | Answered |
| DOM-16 | Spanish (`es-CR`) only for now, but all copy goes through **next-intl** so adding a locale only adds a messages folder. CRC only; no IVA. | Answered |
| DOM-17 | Glossary confirmed; `SeasonalTheme` is renamed `Theme`. See [glossary](blueprint/docs/domain/glossary.md). | Answered |

## 3. Architecture

| ID | Decision | Source |
|---|---|---|
| ARC-01 | Next.js 16 + Supabase + Vercel. | Answered ✅ |
| ARC-02 | Real App Router routes, `(store)` and `(admin)` route groups. | Answered ✅ |
| ARC-03 | **English** URL slugs (`/shop`, `/admin/orders`). | Answered |
| ARC-04 | Hybrid with a mechanical rule. See [architecture §2](03-architecture.md#2-where-logic-lives). | Answered ✅ |
| ARC-05 | No Supabase Edge Functions. All server code runs in Next (Server Actions + Route Handlers). | Answered ✅ |
| ARC-06 | `pg_cron` + `pg_net` hit Next job endpoints. The outbox table is the queue. | Answered ✅ |
| ARC-07 | `supabase-js` + generated types, only inside `server/` repositories (Data Access Layer). | Answered ✅ |
| ARC-08 | Zod schemas in `domain/`; types inferred from them. | Answered ✅ |
| ARC-09 | Server Components + Server Actions. Client cart store over `localStorage`, re-priced server-side at checkout. | Answered ✅ |
| ARC-10 | **Tailwind CSS v4**, design tokens in `@theme`. | Answered |
| ARC-11 | **shadcn/ui** components (copied into `src/shared/ui`, restyled with our tokens). | Answered |
| ARC-12 | Single Next app, no monorepo tooling. | Answered ✅ |
| ARC-13 | Vertical slices: per-feature `domain/` (pure), `server/` (I/O), `ui/`. | Answered ✅ |

## 4. Database

| ID | Decision | Source |
|---|---|---|
| DB-01 | **Schema per domain**, one per feature that owns data: `access`, `catalog`, `retail`, `orders`, `fulfillment`, `inventory`, `notifications`, `themes`, `media`, `reporting`. Internal helpers live in an unexposed `private` schema. | Answered ✅ |
| DB-02 | `snake_case`, plural tables, `<entity>_id` FKs, `<verb>_at`, `is_`/`has_`, named constraints and indexes. | Answered ✅ |
| DB-03 | `uuid` v7 PKs; `orders.order_number` identity shown as `SNK-000123`. | Answered ✅ |
| DB-04 | Colones have no céntimos, so amounts are whole colones in an `amount_crc` domain (`integer`, ≥ 0). No currency column. | Answered |
| DB-05 | Postgres enums for closed, code-coupled sets; lookup tables when rows carry attributes or admins edit them. | Answered ✅ |
| DB-06 | `created_at`, `updated_at` everywhere; `created_by`/`updated_by` on admin-edited tables. | Answered ✅ |
| DB-07 | `archived_at` for catalog/config; never delete orders, payments, refunds or events; hard-delete ephemeral rows from a job. | Answered ✅ |
| DB-08 | Snapshot columns on order items and fulfillment rows. | Answered ✅ |
| DB-09 | **Option (b), table-per-method.** You're right: it's the normalized design. Implemented as class-table inheritance: `orders.fulfillment_method` + `order_pickups` / `order_deliveries`, each with a composite FK `(order_id, fulfillment_method)` that guarantees it matches. See [ER design §9](02-er-design.md#9-orders). | Recommended |
| DB-10 | Append-only `orders.order_events` = status history, audit log, and the event feed notifications read. | Answered ✅ |
| DB-11 | Per-feature singleton `settings` tables plus typed hours tables. No JSONB config. | Answered ✅ |
| DB-12 | `media.files`, referenced by FK. | Answered ✅ |
| DB-13 | **Keep the idempotency key on the resource** (`orders.idempotency_key` + `request_fingerprint`). Transitions are idempotent by state (compare-and-set); webhooks dedupe in the inbound inbox. A generic `idempotency_keys` table waits for a third non-idempotent create (rule of three). See [ER design §9](02-er-design.md#idempotency-db-13). | Recommended |
| DB-14 | App-wide **transactional outbox** (`events.domain_events`) feeding consumers; **Strategy + Registry** for channel adapters; admin actions as **capabilities** shared by the web admin, the bot and the future agent. See [architecture §5](03-architecture.md#5-telegram-admin-bot-and-notifications) and [ADR 0006](blueprint/docs/adr/0006-events-messaging-admin-chat.md). | Recommended |
| DB-15 | Generic tables split by concern: `events` (domain_events, event_receipts), `messaging` (channel_identities, link_tokens, outbound_messages, inbound_updates), `notifications` (notification_types, subscriptions, subscription_brands, admin_notification_settings), `admin_chat` (conversations, command_log). No order or Telegram columns in any of them. See [ER design §10](02-er-design.md#10-events-messaging-notifications--admin-chat-db-1415). | Answered |
| DB-16 | RLS on every table, default deny, explicit grants, `private.has_permission()`, pgTAP per policy. | Answered ✅ |
| DB-17 | Triggers only for mechanical work (`updated_at`, price history). Business effects happen explicitly in RPCs. | Answered ✅ |
| DB-18 | Declarative schema (`supabase/schemas/`) + generated migrations; reference data in hand-written `*_data.sql` migrations. | Answered ✅ |
| DB-19 | pgTAP via `supabase test db`. | Answered ✅ |
| DB-20 | Deterministic demo `seed.sql`. | Answered ✅ |
| DB-21 | Keep everything for now; revisit retention later. | Answered |
| DB-22 | `reporting` schema with permission-checked SQL functions (sales by day, brand, product, zone). | Answered (see Scope split) |

## 5. Structure

| ID | Decision | Source |
|---|---|---|
| DIR-01 | Proposed layout, adjusted for schema-per-feature and next-intl. See [04-structure.md](04-structure.md). | Default |
| DIR-02 | Cross-feature imports only through `index.ts`; enforced with `eslint-plugin-boundaries`. | Answered ✅ |
| DIR-03 | Colocated unit/integration tests; `tests/e2e` for Playwright. | Answered ✅ |
| DIR-04 | `AGENTS.md` per top-level dir and feature; `CLAUDE.md` = `@AGENTS.md`. | Answered ✅ |
| DIR-05 | 7-section template, ≤ 80 lines. | Answered ✅ |
| DIR-06 | PR template checkbox for `AGENTS.md` updates. | Answered ✅ |
| DIR-07 | `kebab-case` files, `PascalCase` components, `use-*.ts` hooks, `import "server-only"` in `server/`. | Answered ✅ |
| DIR-08 | One `index.ts` per feature. | Answered ✅ |

## 6. Agent guidelines

| ID | Decision | Source |
|---|---|---|
| AG-01 | Correctness > Security > Simplicity > Readability > Testability > Performance > Extensibility > DRY. | Answered ✅ |
| AG-02 | All eight design principles. | Answered |
| AG-03 | File ≤ 300 lines, function ≤ 50, component ≤ 150, JSX nesting ≤ 3, no `any`, `!` only with a comment. | Answered ✅ |
| AG-04 | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`. | Answered ✅ |
| AG-05 | `Result<T, E>` for expected failures; throw only for bugs. | Answered ✅ |
| AG-06 | Every Server Action and job logs each step through one structured logger (JSON to stdout). No external provider yet; the logger hides the transport so one can be added later. | Answered |
| AG-07 | Unit, integration, pgTAP, Playwright; TDD for domain. | Answered ✅ |
| AG-08 | Definition of Done as proposed. | Answered ✅ |
| AG-09 | Never-do list as proposed. | Answered ✅ |
| AG-10 | Stop and ask on the listed areas, **always with a recommendation**. | Answered |
| AG-11 | ADR for refactors, design changes, complex features, schema, architecture, dependencies. Approver: Alejandro Loaiza. | Answered |
| AG-12 | Platform APIs first; every new dependency justified in its PR. | Answered ✅ |
| AG-13 | JSDoc with `@` tags on exported functions/components. One or two short sentences, no multi-paragraph blocks, no code references. | Answered |
| AG-14 | Action branches only (`feat/`, `fix/`, `refactor/`, `chore/`, `docs/`), no agent prefixes, cut from `rework` during the rework (G-08). No size limit, no required reviewers, squash merge into `rework`. Conventional Commit messages (to match the branch prefixes). | Answered (commit format assumed) |
| AG-15 | `AGENTS.md` is the single source. | Answered ✅ |

## 7. Quality & ops

| ID | Decision | Source |
|---|---|---|
| Q-01 | CI: typecheck → lint → format check → unit → build. Not required for merge. DB tests and e2e run locally (`npm run test:db`, `npm run test:e2e`). | Answered |
| Q-02 | Pre-commit hooks with **husky + lint-staged** (Prettier + ESLint on staged files) and **commitlint**; `pre-push` runs typecheck + unit tests. | Answered |
| Q-03 | Recommended: a free staging setup = a **second Supabase project on the free tier** + the Vercel **preview** deployment of a long-lived `staging` branch, with branch-scoped env vars. Supabase Branching and Vercel custom environments are paid features. See O-5 for the plan caveat. | Recommended |
| Q-04 | One validated env module per side (server, public); only it reads `process.env`. | Answered |
| Q-05 | Email + password. **Recommended session policy:** 1 h access token, refresh-token rotation on, **7-day absolute session limit**, **24 h inactivity timeout**. Use Supabase's time-box/inactivity settings if the plan includes them; otherwise enforce in the `access` DAL using the session's `created_at`. | Recommended |
| Q-06 | Receipts: JPG/PNG, ≤ 5 MB, ≤ 12 MP; private buckets, signed upload URLs, short-lived signed read URLs. | Answered ✅ |
| Q-07 | Webhook secret verification, shared secret on job endpoints, basic checkout rate limit. The Telegram integration is redesigned as a messaging-channel adapter. | Answered ✅ |
| Q-08 | WCAG 2.2 AA through low-effort defaults (shadcn/Radix primitives, semantic HTML, labels, contrast tokens, keyboard paths). Lighthouse/CWV not gating. | Answered |
| Q-09 | `DESIGN.md` → Tailwind tokens + shadcn primitives in `shared/ui`, done before any feature UI. | Answered |
| Q-10 | Backups not a priority for v1; tracked as O-6. | Answered |
| Q-11 | Downtime window acceptable. Stop checkout → resolve pending orders → migrate catalog/config → switch. Rollback = old deployment. | Answered |
| Q-12 | No feature flags; all-at-once cutover. | Answered |

## Scope split

New items from the answers, sorted with constraint 1.

| Item | v1 | Why |
|---|---|---|
| Brands as data (DOM-01) | **Build** | Changes keys (products → brand FK). |
| Variants (DOM-11) | **Build (schema + admin CRUD)**; every current product gets one default variant, so the storefront looks the same | Order items and stock point at variants; retrofitting later rewrites both. |
| Categories (DOM-11) | **Build schema**; the storefront keeps grouping by brand | Join table, cheap. |
| Price history (DOM-11) | **Build** (trigger-maintained) | Mechanical, nearly free. |
| Bundles (DOM-11) | Design only | Additive: `catalog.bundle_components`. |
| Cancellation + refund on cancel (DOM-04/06) | **Build** | Explicitly asked for; touches stock and refunds, so it should be tested with them. |
| Progress statuses (DOM-03) | **Build in schema + state machine**; one admin button per allowed transition | Enum values are cheap; the UI is generic, driven by the transitions table. |
| Optional per-pickup-location stock (DOM-10) | **Build in schema**; v1 data uses global stock only | Changes stock keys. |
| Points of sale vs pickup locations (F-4) | **Build** (`retail` feature + `/where-to-buy`) | Today one table mixes two concepts; splitting later would migrate live data. |
| Theme scheduling / per-brand (DOM-15) | Design only | Additive: `themes.activations`. |
| Reporting (DB-22) | **Build SQL functions**; admin UI is O-2 | Views/functions are cheap and isolated. |
| Telegram admin bot: alerts + Confirm/Reject flow + linking (F-5) | **Build** (MVP) | The main admin use case. |
| Bot summaries and commands (step 2) | Design only: `digest_schedules`, `/pendientes`, `/resumen` | Additive on events, notifications and capabilities. |
| AI agent in the bot (step 3) | Design only: `assistant_*` tables, capabilities as tools | Post-MVP; capabilities already enforce permissions. |
| Couriers (DOM-07) | Design only | Additive: nullable `courier_id` on deliveries. |
| next-intl (DOM-16) | **Build** | Structural: every string goes through it from day one. |

## Open questions

| ID | Question | Recommendation | Needed before |
|---|---|---|---|
| O-1 | Is `orders.settings.is_demo_mode` (today's `demo_catalog`: allows orders while SINPE isn't configured) still needed? | Drop it. Seed data covers local demos, and production must never take orders without payment details. | Orders feature |
| O-2 | Should the admin **Reports** page ship in v1, or only the SQL functions? | SQL functions now, page right after parity. | Reporting feature |
| O-3 | Require TOTP MFA for admins? | Yes for `owner`. It's low-effort with Supabase Auth and protects payment data. | Access feature |
| O-5 | Hosting plan: **Vercel Hobby is non-commercial only** and Supabase free projects pause after a week of inactivity. Is a shop taking orders on paid plans (Vercel Pro, Supabase Pro)? This also unlocks Supabase Branching and session time-boxes. Verify current pricing. | Move production to paid tiers before launch; keep staging on free tiers. | Cutover |
| O-6 | Backups/PITR and a restore drill. | Revisit after launch; Supabase Pro includes daily backups. | After launch |

## Feedback log

Changes requested after the first draft (2026-10-24).

| ID | Feedback | Resolution |
|---|---|---|
| F-1 | Show the fields of each table in the ER diagrams. | [02-er-design.md](02-er-design.md) has one Mermaid diagram per schema with every column, type, key and a short note. |
| F-2 | Code must be readable and organized, not dense blocks. | Root `AGENTS.md` adds **Readability & formatting** rules with a rejected/accepted example; ER design §13 adds the SQL style; examples in the architecture doc were rewritten to match. |
| F-3 | Components only render; hooks hold the logic. | New `hooks/` folder per feature; root and feature `AGENTS.md` define the component ↔ hook contract; the import rules forbid `ui/` from importing Server Actions; hooks get `renderHook` tests. |
| F-4 | Points of sale (third-party stores) ≠ pickup locations (Snackyzz-managed). Per-location stock is optional, falling back to global stock. | New `retail` feature/schema (`points_of_sale`); `fulfillment.pickup_locations`; `inventory.stock_levels.pickup_location_id` nullable (null = global) with a fall-back reservation rule. This resolves the former O-4. |
| F-5 | Notifications looked order-centric. Telegram should let admins manage orders (MVP: receive → Confirm/Reject), get summaries (step 2) and later ask an AI agent (step 3). It was WIP, so redesign freely. | Split into `events`, `messaging`, `notifications`, `admin-chat` + capabilities. Order specifics live only in event payloads and capabilities. MVP flow, linking and edge cases in architecture §5. ADR 0004 superseded by [0006](blueprint/docs/adr/0006-events-messaging-admin-chat.md). |
