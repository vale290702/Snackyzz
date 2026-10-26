# Catalog UX evidence

Approved directions: [design](../../../superpowers/specs/2026-10-25-catalog-ux-design.md). All captures use 390 × 844 phone and 1440 × 1000 desktop viewports, es-CR locale, and reduced-motion preference.

- `main/`: reference at `89ba1ef`, run separately on port 5184. Browser-only legacy API fixtures map the two rebuild seed products to the legacy shape (including reference product photos and synthetic stock 99). The owner signs in against local Auth; legacy admin reads are browser fixtures. These captures document visual parity, not legacy backend behavior. No production connection or database changes.
- `before/`: exact PR #31 starting head `8af9208`, run on port 5183 against the shared local stack, signed in as the demo owner for administration.
- `after/`: completed approved directions, run on port 5183 against the same local stack and account. Photo placeholders reflect seed records without uploaded images. Integration tests leave additional brands/categories; no new many-brand filter work was added. Failed e2e products created during this pass were archived through the UI before the final after captures.

The initial shared-stack DNS failure recovered externally. No Supabase reset, stop or start was run. The native connected browser blocked localhost, so Playwright with installed Chrome captured these screens. Detail/editor captures wait for their finite animations to finish.

## Phone comparisons

| Screen | main | Before this pass | After |
|---|---|---|---|
| Shop | [main](main/shop-390.png) | [before](before/shop-390.png) | [after](after/shop-390.png) |
| Single presentation detail | [main](main/shop-detail-390.png) | [before](before/shop-detail-390.png) | [after](after/shop-detail-390.png) |
| Brand page | [main](main/baking-stereo-390.png) | [before](before/baking-stereo-390.png) | [after](after/baking-stereo-390.png) |
| Multiple presentation detail | [main](main/baking-stereo-detail-390.png) | [before](before/baking-stereo-detail-390.png) | [after](after/baking-stereo-detail-390.png) |
| Admin list | [main](main/admin-catalog-390.png) | [before](before/admin-catalog-390.png) | [after](after/admin-catalog-390.png) |
| Product editor | [main](main/admin-editor-390.png) | [before](before/admin-editor-390.png) | [after](after/admin-editor-390.png) |
| One-step creation | — | — | [after](after/admin-create-390.png) |

## Desktop comparisons

| Screen | main | Before this pass | After |
|---|---|---|---|
| Shop | [main](main/shop-1440.png) | [before](before/shop-1440.png) | [after](after/shop-1440.png) |
| Single presentation detail | [main](main/shop-detail-1440.png) | [before](before/shop-detail-1440.png) | [after](after/shop-detail-1440.png) |
| Brand page | [main](main/baking-stereo-1440.png) | [before](before/baking-stereo-1440.png) | [after](after/baking-stereo-1440.png) |
| Multiple presentation detail | [main](main/baking-stereo-detail-1440.png) | [before](before/baking-stereo-detail-1440.png) | [after](after/baking-stereo-detail-1440.png) |
| Admin list | [main](main/admin-catalog-1440.png) | [before](before/admin-catalog-1440.png) | [after](after/admin-catalog-1440.png) |
| Product editor | [main](main/admin-editor-1440.png) | [before](before/admin-editor-1440.png) | [after](after/admin-editor-1440.png) |
| One-step creation | — | — | [after](after/admin-create-1440.png) |

## Deliberate deviations (G-09 rules 2–3)

- Multi-presentation cards expose the actual minimum price, count and explicit chooser, avoiding an unannounced default package purchase.
- Phone product detail is a bottom sheet with persistent purchase footer and scrollable content. Desktop keeps two columns, with bounded scrolling and a distinct purchase footer.
- Admin editing becomes a modal right sheet on desktop and full-height sheet on phones, retaining list position, filters and originating focus. Unsaved changes require explicit discard; in-flight saves, uploads and ordering block leaving.
- First presentation fields appear inline with a single product, including creation. Additional presentations use the existing management list. Complete success requires both saves; partial failure retains the same product for retry.
- Activos is the initial status filter. Missing-default products show an explicit not-visible status.
- Slug generation and explicit editing, palette/custom hex controls, optional searchable categories, and up/down ordering replace technical/manual fields. Categories remain admin-only optional cross-brand grouping; storefront still groups by brand.
- Loading skeletons and save toasts provide waiting/completion feedback.
- Existing Sheet, Dialog, Sonner and actions are reused. No dependency, schema, money/stock rule, permission or purchase-provider API changes.

## Verification

- `npm run check`: pass (339 unit/component tests, tooling, typecheck, lint, formatting, production build).
- `PORT=5183 npm run test:e2e -- --workers=2`: 28 pass, desktop and mobile.
- `npm run test -- --project integration src/features/catalog`: 33 pass.
- Catalog pgTAP is unchanged; no schema migration or generated DB type change.
