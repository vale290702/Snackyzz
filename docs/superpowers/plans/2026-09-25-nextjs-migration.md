# Snackyzz Next.js Migration Implementation Plan

> **For agentic workers:** Use executing-plans to implement this plan task-by-task after the user approves the migration direction. Do not infer authorization to deploy production from this planning request.

**Goal:** Replace the vanilla JavaScript/Vite frontend with Next.js, React, and TypeScript while preserving the current design, catalog, shared cart, checkout, and administration.

**Architecture:** Use Next.js App Router as the application host and React Client Components for the existing hash-routed experience. Preserve browser-side catalog loading and authentication behavior; moving those operations to the server is outside this migration. Keep Supabase PostgreSQL, Auth, Storage, and the existing Edge Functions as the backend. Host the replacement frontend on Vercel, with a separate preview before production cutover.

**Tech Stack:** Next.js App Router, React, strict TypeScript, existing CSS and locally hosted fonts, @supabase/supabase-js, Vitest with React Testing Library for client units, and Playwright for browser flows. Choose supported stable compatible package versions at execution and pin the lockfile; do not use canary releases.

**Spec:** The user requests a frontend migration plan, favors Next.js, and previously accepted TypeScript as the proposed companion. The user explicitly requires ZERO changes to design, visuals, functionality, or flows. This overrides every migration convenience; implementation is underway on the isolated migration branch.

## Global constraints

**Hard acceptance rule:** This is an internal technology replacement only. The result must look and behave exactly like the existing app. No redesign, visual cleanup, new features, removed features, copy changes, route renaming, navigation changes, auth/session changes, or altered user flows. If a technical incompatibility threatens parity, stop and present it instead of silently changing behavior. Any improvement belongs in a separate, explicitly approved task.

- Preserve Spanish copy, actual database products, current images, fonts, spacing, mobile behavior, and brand colors. Do not reseed products: administrators have already edited the catalog.
- Preserve orange “Snackyzz” and pink “X Baking Stereo” on chocolate; Baking Stereo purchase controls become pink on hover, neutral at rest. Keep both catalogs separate with one cart.
- Preserve admin product brand and status filters, product editing/archive/restore, order review/confirmation/email retry, store settings, pickup points, and delivery scheduling.
- Keep the existing database schema, RLS, storage buckets, service-side price calculation, and Edge Function request contracts.
- Keep the `snackyzz-cart` localStorage key and product-ID-to-quantity format. Do not read storage during server rendering or overwrite stored quantities before hydration.
- Backend credentials and email secrets stay in Supabase. Only public Supabase URL/key may use NEXT_PUBLIC_ variables.
- Preserve existing uncommitted PRODUCT.md, supabase/README.md, surface briefs, and local tool files. Work in a separate migration branch/worktree from the verified feature branch; copy applicable design context without committing unrelated changes.
- This is a frontend migration, not a redesign, payment-provider change, new inventory system, or backend rewrite.

## Routing and flow: unchanged

Keep the current URLs exactly: `#` / `#home`, `#shop`, `#baking-stereo`, `#sales`, `#about`, `#checkout`, `#success`, and `#admin`, including supported `#/...` variants. Preserve unknown-hash fallback, back/forward behavior, skip links, scroll/focus handling, current menu labels and admin tabs. Do not introduce `/snackyzz`, `/admin/login`, or other user-facing paths in this migration.

Next.js hosts the application at `/`; a React route switch follows the existing hash contract. This intentionally defers per-page server rendering and clean-path routing to a separately approved future project. Adopting Next.js does not authorize changing the experience to showcase its features.

## Target structure and ownership

```text
src/app/layout.tsx                         # document, current global CSS/fonts/metadata
src/app/page.tsx                           # mounts the migrated app at the existing URL
src/components/app-shell.tsx               # existing hash routing and state boundaries
src/components/store/                     # navigation, cards, dialogs, cart
src/features/pages/                       # current home/shop/sales/about views as JSX
src/features/cart/                        # existing quantity logic + client provider
src/features/checkout/                    # existing draft, receipt and success behavior
src/features/admin/{orders,products,settings}/
src/lib/supabase/browser.ts                # existing client/auth options and session storage
src/lib/{catalog,edge-functions,collections,delivery,router}.ts
src/types/{database,domain}.ts
public/assets/                            # unchanged /assets/... runtime URLs
```

Keep the source CSS in `src/styles.css` initially and import it from the root layout. JSX replaces HTML strings; React state replaces document-wide delegated event handlers and `app.innerHTML` replacement. Do not use dangerouslySetInnerHTML to keep the old application inside React. Keep existing plain images initially to avoid changing crops or remote-image behavior during parity work; image optimization can follow separately.

## Task 1: Record the working baseline and isolate the migration

**Files:** Existing `src/`, `tests/`, `package.json`, `playwright.config.js`; migration branch/worktree and `tests/visual/` baseline captures.

- [ ] Verify the current branch/remote and record its commit before creating `migration/nextjs-typescript` in an isolated worktree.
- [ ] Run `npm test`, `npm run test:e2e`, and `npm run build` using a compatible supported Node release. Record pre-existing failures rather than silently treating them as migration regressions.
- [ ] Capture home, both catalogs, product dialog, mixed cart, checkout, success, and all admin views at desktop and mobile widths. Include Baking Stereo neutral/hover controls.
- [ ] Record the current Edge Function payloads and responses from `src/lib/api.js` and `src/main.js`. Use synthetic customer details and fixtures in tests.
- [ ] Preserve the current deployable frontend as the rollback target; commit only baseline test/config additions.

**Acceptance:** A reproducible baseline exists without changing the live database or current branch's uncommitted files.

## Task 2: Build the Next.js shell and preserve routes/assets

**Files:** `package.json`, lockfile, `tsconfig.json`, `next-env.d.ts`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/app-shell.tsx`, `src/lib/router.ts`, `public/assets/`, `.env.example`.

- [ ] Add a browser test for `/`, `/#shop`, direct `/#baking-stereo` reload, and loaded font/image assets. Run these parity tests against the new shell before implementing the matching views.
- [ ] Install stable compatible Next.js/React/TypeScript packages and add `dev`, `build`, `start`, `typecheck`, and explicit `lint` scripts. Keep dev port 5174 to minimize local origin changes.
- [ ] Move runtime assets to `public/assets` while retaining URL paths and provenance. Exclude source prompts/reference material from publicly served files where they are not runtime assets.
- [ ] Import existing CSS; recreate header/footer as JSX with identical classes, responsive menu behavior, links, metadata and skip-link semantics. Preserve hash navigation rather than substituting Next Link paths.
- [ ] Rename public environment variables to `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; document the existing anon-key fallback if still needed. Do not copy secrets into source or public directories.
- [ ] Verify existing hash routes, asset URLs, keyboard navigation, build, and typecheck; commit the shell.

**Acceptance:** Next.js boots with the existing visual shell and preserves every existing link. No live cutover.

## Task 3: Establish typed catalog access and migrate public pages

**Files:** `src/types/database.ts`, `src/types/domain.ts`, Supabase client helpers, `src/lib/catalog.ts`, `src/lib/collections.ts`, public view components, product card/grid components.

- [ ] Generate database types from the existing schema through the CLI; define normalized UI types rather than asserting unvalidated API responses as typed data.
- [ ] Port collection and money helpers; retain `brand || 'snackyzz'` compatibility. Define `Brand = 'snackyzz' | 'baking-stereo'` and `getCatalog(): Promise<Catalog>` with the same product, sales-point and settings normalization as today's API.
- [ ] Test brand partitioning, archived-product exclusion, failed catalog loading, and absence of sample fallback in a configured live store.
- [ ] Preserve current browser catalog queries, loading order, error handling and refresh triggers. Do not add server fetching, caching or a new loading experience.
- [ ] Convert home, both collections, locations, and about to JSX; preserve current markup/classes and all real copy. Preserve the exact rendered structure and states; Next.js hosting does not require moving these views to server rendering.
- [ ] Port the existing loading, retryable error, and empty states exactly. Explicit demo mode may use sample products and must prevent real order submission; a backend error must never silently replace edited catalog data with samples.
- [ ] Run rendering/partition tests, visual comparison, and build; commit the public catalog.

**Acceptance:** Correct live products appear per brand, and freshly edited products appear on a fresh visit. No design, copy, layout or behavior changes are permitted.

## Task 4: Migrate the shared cart and product dialog

**Files:** `src/features/cart/{cart,cart-provider}.tsx` (pure logic may use `.ts`), store product-card/dialog/cart components, existing cart and collection tests adapted to TypeScript.

**Interface:** `useCart()` provides `lines`, `count`, `total`, `hydrated`, `changeQuantity(id, delta)`, and `clear()` from one provider at the existing application-state lifetime.

- [ ] Port existing cart tests first: malformed storage, unknown IDs, caps, fractional changes, quantity persistence, and catalog-based totals.
- [ ] Add a hydration test: seed `snackyzz-cart` before visiting, render server markup without browser globals, and ensure hydration neither warns nor overwrites the stored cart with an empty object.
- [ ] Implement client provider initialization after hydration; reconcile against the full catalog, not the visible brand subset. Persist only after initialization.
- [ ] Wire cards, steppers, header count, cart totals, and dialog using React handlers. Preserve dialog focus restoration, Escape dismissal, disabled states, and toast announcements.
- [ ] Test add Snackyzz → navigate Baking Stereo → add product → reload → both remain → checkout total uses current catalog prices.
- [ ] Run unit/browser checks and commit the cart.

**Acceptance:** Existing same-origin customer carts survive deployment. A different preview domain has separate browser storage; do not represent that as a cart migration failure.

## Task 5: Migrate checkout, delivery, and order success

**Files:** `src/features/checkout/`, `src/lib/delivery.ts`, `src/lib/edge-functions.ts`, checkout/success views, existing fulfillment/delivery/browser tests.

**Interface:** `createOrder(form: FormData, idempotencyKey: string): Promise<{order: Order}>` calls the existing `create-order` Edge Function directly from the browser.

- [ ] Port tests for required receipt, JPG/PNG validation, size/decoding errors, racing replacement files, failed submission, retry key reuse, delivery lead time/slots, pickup and messenger fields.
- [ ] Keep draft/contact/fulfillment and File state in a application client provider so ordinary collection navigation does not discard checkout work. Revoke preview object URLs on replacement/unmount; do not serialize Files or sensitive receipt data to localStorage.
- [ ] Preserve multipart keys: name, email, phone, items (`productId`, quantity only), receipt, fulfillmentType, pickupLocationId, deliveryAddress, deliveryDate, deliverySlotStart. Preserve the `Idempotency-Key` header and invalidation when request contents change.
- [ ] Upload receipts directly to the existing Edge Function, not through a new Next.js upload proxy or Server Action. This retains current validation and avoids introducing another request-size constraint.
- [ ] Only clear the cart and show success after the persisted API response. Keep success order data in memory as today; direct visit/reload without that state renders the existing safe no-order state, never invented success.
- [ ] Verify pending-review language, confirmation-email expectations, WhatsApp link, duplicate-submit prevention, and retry behavior. Commit checkout.

**Acceptance:** One mixed-brand order reaches the existing backend correctly; failures preserve draft/cart/receipt and never present payment as confirmed.

## Task 6: Migrate admin components without changing authentication or flows

**Files:** `src/lib/supabase/browser.ts`, existing API adapter migrated to TypeScript, `src/features/admin/`, existing admin filter and browser tests.

- [ ] Write parity tests for signed-out users, authenticated non-admins, expired sessions, authorized admins, and logout using current expected behavior.
- [ ] Keep the existing Supabase browser client, project URL, storage key and auth options (`persistSession`, `autoRefreshToken`, `detectSessionInUrl`). Preserve the existing sign-in form and `is_admin` check. Existing Edge Functions remain the authorization boundary for privileged operations.
- [ ] Do not introduce cookie/SSR authentication, new login routes, new accounts, password resets, or a forced new login as a migration feature. Verify a valid existing same-origin session survives the frontend replacement; normal expiry behavior stays unchanged.
- [ ] Convert order review, product management and settings to components while retaining `#admin` and its current tabs. Preserve filters, search, selected details, busy/error states, editor behavior, archive/restore, image uploads, receipt links, confirmation and email retry.
- [ ] Keep calls and payloads to `manage-products`, `manage-orders`, and `manage-store` unchanged; preserve current list/catalog refresh behavior after mutations.
- [ ] Verify session refresh/logout, direct `#admin` visits, CRUD and schedule changes against staging. Commit only internal migration changes.

**Acceptance:** Same login, permissions, session persistence, admin screens and workflows. No user-visible auth or navigation changes.

## Task 7: Restore full test coverage and compare the design

**Files:** `vitest.config.ts`, test setup, `tests/unit/`, `tests/components/`, `tests/e2e/`, `playwright.config.ts`, CI workflow if the repository uses one.

- [ ] Port Node unit tests to the selected TypeScript test runner, replacing HTML-string assertions with behavior-focused component tests where appropriate.
- [ ] Preserve all current business-rule browser tests, including the receipt replacement race, shared cart, admin filters, and email retry.
- [ ] Retain browser network mocking because catalog and auth requests stay browser-side. Also validate the existing contracts against a local/test Supabase instance with synthetic data. Do not modify production catalog data or send customer email during tests.
- [ ] Add existing-URL refresh/back-forward tests, hash-route parity tests, hydration-console checks, session expiry, stale catalog handling, keyboard dialogs, and mobile overflow checks.
- [ ] Compare all baseline screenshots in one desktop/mobile review batch; fix identified differences in one batch and confirm. Keep approved copy and brand treatments exact.
- [ ] Require typecheck, lint, unit/component tests, production build, and E2E against the production server to pass. Commit final parity fixes.

**Acceptance:** All preserved flows pass and no design, functionality or flow differences remain. Any staging limitation is disclosed before launch.

## Task 8: Vercel preview, cutover, and rollback

**Files:** deployment/environment documentation; Vercel project settings; existing Supabase origin configuration (configuration only).

- [ ] Create a Vercel preview connected to the migration branch, using a staging Supabase project for mutations, receipts and email tests. Existing production data may be inspected read-only to verify catalog parity, not overwritten by fixtures.
- [ ] Configure public environment values separately for preview and production. Select a supported Node runtime satisfying Next.js requirements and update engines/lockfile together.
- [ ] Add the exact preview and final production origins to Edge Functions' ALLOWED_ORIGINS; preserve existing origins during transition. Preserve existing Supabase Auth configuration; add only environment origins required for the preview without changing the sign-in flow. Avoid a blanket wildcard for arbitrary Vercel previews.
- [ ] Verify orders, uploads and login on the actual preview URL. If preview protection is enabled, confirm the intended reviewers can access it.
- [ ] Present the working preview and check results for approval before switching the production domain.
- [ ] After approval, deploy to the existing customer-facing origin where possible, run a bounded smoke check, and monitor catalog/auth/order errors. Record the previous deployment for instant frontend rollback; no schema reversal is required.
- [ ] Remove obsolete Vite config, superseded JavaScript implementations, DOM renderers and unused dependencies only after parity is proven. Keep historical baseline via Git; preserve required Deno lockfiles for the backend. Update run/deploy documentation.

**Acceptance:** Approved Next.js release is live, legacy links work, and the previous frontend can be restored without reverting customer data.

## Main decisions and tradeoffs

- Recommended: Next.js + TypeScript now, while keeping backend contracts stable. React + Vite is a smaller tooling change; user preference favors Next.js. This parity release retains client-rendered pages.
- Do not migrate Edge Functions into Next.js API routes in this project. That would add an independent backend migration involving uploads, mail, authorization and retry behavior.
- Do not add Tailwind, a component kit, Redux, or a redesign. Existing CSS and React context/local state are sufficient for the current scope.
- Next.js provides the host/build/deployment layer; the parity release retains the existing client-rendered experience. Existing browser authentication and hash URLs remain unchanged.
- Catalog fetching and refresh behavior remain unchanged. Caching, server rendering and other optimizations require a separate proposal if they affect behavior.
- Implementation effort is concentrated in checkout and admin, not installing Next.js. Schedule estimates should follow the baseline/parity checkpoint, not an assumed one-command conversion.

## References checked for this plan

- Next.js Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js Vite migration guide: https://nextjs.org/docs/app/guides/migrating/from-vite (its existing-React assumptions do not eliminate our HTML-string-to-JSX work).
- Supabase SSR client/session setup reviewed but NOT adopted: https://supabase.com/docs/guides/auth/server-side/creating-a-client. Its cookie-session changes are outside the user's parity requirement.

Status: Implemented locally; see `docs/nextjs-migration-verification.md` for evidence and remaining preview/cutover requirements.
