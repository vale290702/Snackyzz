# Next.js migration verification

Baseline: `6396184962cb401b4dd85624cb1787b6bcc1e568`, branch
`feature/baking-stereo-collaboration`. Migration branch:
`migration/nextjs-typescript`, worktree `/private/tmp/snackyzz-nextjs`.

## Implemented

Next.js App Router hosts React components with strict TypeScript. Supabase DB
schema types were generated read-only. Storefront, shared cart, receipt upload,
checkout, success and admin screens now use JSX and React state. Hash URLs,
localStorage keys, browser auth options and Edge Function requests are preserved.
CSS and runtime image/font bytes are unchanged. Superseded Vite/JS code is removed;
asset source prompts/provenance remain outside the public directory.

No database data, Edge Function code, credentials or production frontend deployment changed. Preview environment scope and exact allowed origins were configured.
Unrelated original workspace edits were not included in the migration.

## Verification (2026-09-25)

- Strict TypeScript check: passed.
- ESLint: passed.
- Vitest: 23 tests passed, 7 files.
- Next.js optimized production build: passed.
- Playwright against the production server: 28 tests passed, desktop and mobile.
- Original and migrated screenshots: all 30 pairs pixel-identical, same dimensions.
  Includes home, both catalogs, cart, dialog, checkout, success, information,
  locations, admin login/orders/products/filter/editor/settings.
- Read-only independent code review: no important regressions or new security
  issues found in checkout, auth, cart, admin mutations and API migration.

Fixtures intercept Supabase network requests. Tests cover mixed-brand persistence,
existing hashes/back-forward, hydration, mandatory and racing receipt uploads,
failed-order retry/idempotency, admin product changes, confirmation/email retry,
login persistence/logout/non-admin/expired-session behavior, catalog retry and
keyboard dialog/cart focus. No automated live orders or email were sent.

Screenshot artifacts and comparison JSON are in `/private/tmp/snackyzz-parity`.
The local artifact directory is not committed; the comparison summary is included
in `docs/nextjs-visual-comparison.json`.

## Baseline limitations retained

Some mobile admin forms already overflow their viewport; baseline and migrated
screenshots have identical dimensions. The original initially renders sample
catalog data while loading, and retains that state on initial catalog failure;
checkout stays blocked until catalogReady. This behavior was preserved under the
user's zero-behavior-change instruction, despite the stronger proposed no-sample
fallback wording in the plan. Any correction needs a separate change.

## Preview deployment verified (2026-09-26)

The user selected the existing Vercel project and Supabase connection:
`atrizon/snackyzz`, Supabase `skncqvywmionhtfipixt`. GitHub records identify the
current successful production deployment as
`https://snackyzz-9zqtzvqvi-atrizon.vercel.app` (commit `a4d3cef`).

Preview: https://snackyzz-git-migration-nextjs-typescript-atrizon.vercel.app/

Verified Ready deployment: `dpl_4Jd5PM7d5BAWXjAfsSVwK8Soq9xo`, source `6c4be29`.
The Vercel configuration selects Next.js and `.next` per branch. A clean npm v3
lockfile fixes the remote missing optional runtime dependencies while retaining
the direct package versions. Clean install, 23 units, production build, 28 browser
tests and all 30 exact screenshot comparisons passed again after this fix.

The existing public Supabase URL and publishable key now include Preview in their
Vercel scope. Production values are unchanged. The existing ALLOWED_ORIGINS value
was verified against its displayed SHA256 digest before appending the exact
migration preview and local port 5175 origins. Existing port 5174 origins remain.
All four Edge Functions return 204 and the exact allowed origin for preview
preflight requests.

Live authenticated-browser smoke review confirmed the seven existing catalog
products (including the edited Brownies), separate collections, a mixed-brand
cart surviving reload, correct 7,900 CRC checkout total, store delivery settings,
and the signed-out admin form. Browser warning/error logs were empty. Test cart
items were removed afterward. The deployed Baking Stereo design was inspected.

Vercel preview authentication remains enabled. Automated browser tests used the
local optimized production server with mocked Supabase; they did not bypass
preview protection. Live admin login/mutations and order submission were not
exercised: no live order, receipt, product change or customer email was created.
The backend retains its existing demo-store configuration.

Production promotion is not performed. Review this working preview before
cutover. See README for local run instructions and frontend rollback.
