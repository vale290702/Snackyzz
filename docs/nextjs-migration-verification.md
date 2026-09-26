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

No database data, Edge Functions, credentials or production deployment changed.
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

## Deployment remaining

The user selected the existing Vercel project and Supabase connection:
`atrizon/snackyzz`, Supabase `skncqvywmionhtfipixt`. GitHub records identify the
current successful production deployment as
`https://snackyzz-9zqtzvqvi-atrizon.vercel.app` (commit `a4d3cef`).

Vercel browser login is pending. A remote preview, preview environment names,
Next.js build preset, exact CORS origin, and live read-only preview smoke check
remain. No separate staging project was supplied; live mutation testing is not
claimed. Production cutover remains subject to review of the working preview.

See README for local run instructions and rollback to the previous frontend.
