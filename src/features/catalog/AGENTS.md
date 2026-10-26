# features/catalog

## Purpose

What we sell: brands (Snackyzz is primary; collabs are rows), categories, products, variants and their price history. Storefront catalog reads and admin catalog management.

## Owns / does not own

- **Owns:** schema `catalog` (brands, categories, products, product_categories, product_variants, variant_price_history), storefront catalog reads, admin capabilities and actions, the shop and brand pages' product UI, and the admin `CatalogManager`.
- **Does not own:** stock (`inventory`), image storage (`media`; we hold `*_file_id`), themes (`themes`).

## Public API (`index.ts`)

- Storefront: `listStorefrontCatalog(brandSlug?)` → `StorefrontCatalog` (`brands: BrandDto[]` primary first, `categories: CategoryDto[]`, `products: ProductDto[]` with image URLs and `variants: VariantDto[]` in sort order, each flagged `isDefault`). `'use cache'` + `cacheTag("catalog")` + `cacheLife("max")`, anon client. A malformed or unknown slug lists no brands or products.
- Admin actions (each `ActionResult<Record, CatalogErrorCode>`): `createBrandAction`, `updateBrandAction`, `archiveBrandAction`, `setPrimaryBrandAction`; `createCategoryAction`, `updateCategoryAction`, `archiveCategoryAction`; `createProductAction`, `updateProductAction`, `archiveProductAction`; `createVariantAction`, `updateVariantAction`, `archiveVariantAction`, `setDefaultVariantAction`.
- `getBrandShelf(brandSlug?)` → `BrandShelf | null` (`brand`, its `products`, `otherBrands`): the primary brand without a slug; null for an unknown or malformed one. Built on `listStorefrontCatalog`, so it shares its cache.
- `getCatalogManager()` → `CatalogManagerData` (every brand with `logoUrl`, category, product with `imageUrl`, and variant, archived ones included). Requires `catalog.manage`: visitors are redirected to sign-in, staff get `forbidden()`. Dynamic; call it inside `<Suspense>`.
- UI: `BrandPage({ shelf })` (bespoke page by slug, else the generic one), `ProductGrid`, `ProductPurchaseProvider({ purchase })` (the add-to-cart seam), `CatalogManager({ data })`, `CatalogShelfSkeleton`, `CatalogManagerSkeleton` (route Suspense fallbacks).
- Types: admin records `Brand`, `Category`, `Product` (with `categoryIds`), `Variant`; `ManagedBrand`, `ManagedProduct`, `CatalogManagerData`; DTOs `BrandDto`, `CategoryDto`, `ProductDto`, `VariantDto`, `StorefrontCatalog`, `BrandShelf`; `CatalogErrorCode`.

## Layout

- `domain/fields/`: `CatalogFields` (slug, accent color, price, sort order, required/optional text, ids) and `CatalogFieldError` codes; limits mirror the SQL checks. `recordIdInputSchema` for archive / set-primary / set-default.
- `domain/<brands|categories|products|variants>/`: input schemas (create, and update with `id`) and text limits. Inputs never carry `isPrimary` or `isDefault`.
- `domain/errors/`: `CatalogError`; Spanish copy for both code sets in `errors.catalog`.
- `server/<brands|categories|products|variants>/`: row schema (snake_case → record), repository, capabilities, actions.
- `domain/images/`: `CatalogImagePurpose` (`product_image`, `brand_logo`), browser-safe.
- `domain/variants/variant-selection.helper.ts`: `VariantSelection` (default, chosen with fallback, whether there's a choice and minimum-price/count summary). `domain/manager/`: manager views, status filters, `RecordAction`, `ManagerRecords` (status and parent filters), `CatalogOrdering` (stable ranks and scoped adjacent moves); generated slug and palette helpers live under `domain/fields`.
- `server/mutation/`: `CatalogPermission`, `CATALOG_CACHE_TAG`, `CatalogImagePurpose` (re-exported from domain), `runCatalogMutation` (admin context → capability → `updateTag("catalog")`), `verifyCatalogImage`, `CatalogResults` (PostgREST response → `Result`: the parsed row, or a code for known constraint names and raised messages; anything else is rethrown).
- `server/storefront/`: anon repository, row schemas, `StorefrontAssembly` (pure), `listStorefrontCatalog`.
- `server/manager/`: `managerRepository` (every row, archived included) and `getCatalogManager`.
- `server/images/images.actions.ts`: `createCatalogImageUploadAction` / `registerCatalogImageUploadAction`, media's upload actions restricted to the catalog purposes. Client hooks call these because media's index also exports server-only reads.
- `server/testing/`: integration-test helpers only (in-memory cookies, demo admins, file fixtures).
- `hooks/storefront/`: `useProductCard`, `useProductDialog`, `useProductPurchase` (+ `ProductPurchaseContext`). `hooks/manager/`: `useCatalogManager`, one form hook per record (`useBrandForm`, `useCategoryForm`, `useProductForm`, `useVariantForm`), `useVariantsSection`, `useRecordAction` / `useArchiveRecord`, `useCatalogImageUpload`, `useProductSubmission` (product + inline presentation save and partial retry), friendly field hooks, `useCatalogNavigation` / `useCatalogEditor` (modal focus, dirty and busy guards), `useCatalogOrdering` (one sequential move at a time).
- `ui/storefront/`: `ProductGrid`, `ProductCard`, `ProductDialog`, `VariantPicker`, `BrandHeader`, `BrandShelf` and shelf parts; `ProductLook` (`classic` / `editorial`) picks the cva variants. `ui/brand-pages/`: `BrandPage`, `GenericBrandPage`, `BakingStereoPage`, `BESPOKE_BRAND_PAGES`. `ui/manager/`: `CatalogManager` (underlined `ViewTabs` for products / brands / categories under the admin header's section tabs, `FilterPills` for brand and status) and its rows, editor and forms. `ui/testing/`: `CatalogRecords` builders for hook and component tests.

## Invariants

- Exactly one brand is primary while any brand is active: a partial unique index allows at most one, a deferrable constraint trigger refuses none, and the primary brand cannot be archived. The first brand created becomes primary; afterwards only `set_primary_brand` moves it. Brand copy is data; never hard-code brand names or slugs in logic.
- At most one default variant per product (partial unique index); the default can't be archived. The first variant created becomes the default; `set_default_variant` swaps it. A product without a default variant (no variants yet) is not on the storefront.
- Carts, orders and stock reference **variants**. One variant renders as a simple product; the picker appears with 2+. Multi-presentation cards show the actual minimum price, count and an explicit choice action; they never directly purchase a hidden default.
- Archived rows disappear from the storefront (RLS for `anon`) but stay referenced by past orders. Rows are never deleted; only category links are.
- Writes go through RLS as the signed-in admin (`catalog.manage`); policies require `created_by` / `updated_by` to be the caller, so audit columns can't be forged. Capabilities check the permission first anyway.
- Image columns only hold files of their purpose (`product_image`, `brand_logo`): capabilities check through `findCatalogImages` (`media`), and the `private.require_file_purpose` trigger enforces it.
- Prices are whole colones > 0. `variant_price_history` is written only by triggers (first price on insert, then each real change, with `updated_by`); never write it.
- Products and their category links are two requests; capabilities check every category is active first, and `set_product_categories` replaces the set atomically.

## Dependencies

`access` (`getAdminContext`, `catalog.manage`), `media` (`findCatalogImages`, `FilePurpose`).

## Testing

- Unit: field and input schemas (each code on its field), `CatalogResults`, `StorefrontAssembly` (including shelves), `VariantSelection`, `ManagerRecords`; `messages.test.ts` covers `errors.catalog`.
- DOM: `renderHook` tests for every hook (server actions mocked); component tests for `ProductCard` (dialog, picker, purchase seam), `BrandPage` (generic, bespoke, empty, brand switch) and `CatalogManager` (labels, filters, editor, field errors, archive confirmation).
- E2E `tests/e2e/catalog.spec.ts`: visitors and staff can't reach `/admin/catalog`, the owner can; shop browsing and the collab variant picker.
- Integration (`*.int.test.ts`, local stack): every action for visitor / staff / owner, `getCatalogManager` and the image wrappers per role, image purposes, taken slugs and SKUs, archive rules, primary and default swaps, price history, storefront filtering and image URLs. Catalog rows can't be deleted, so tests use unique slugs and leave archived fixtures behind (`supabase db reset` clears them).
- pgTAP `catalog.test.sql`: shape, grants, every policy × role, constraints, the one-primary / one-default invariants, file purposes, entry points and the price-history trigger.

## Follow-ups

- The cart provides `ProductPurchaseProvider` around the store layout; until then add to cart is disabled.
- `AdminShell` with section tabs; the catalog page renders `AdminHeader` itself until then.
- `getVariantsForPricing(ids)` for cart and checkout (pricing itself is resolved in SQL).
- Unarchiving, reordering in bulk, and exporting capabilities to `admin-chat`.

## Gotchas

- Bespoke collab pages live in `ui/brand-pages/<slug>.component.tsx` and are registered by slug in `BESPOKE_BRAND_PAGES`; other brands get `GenericBrandPage`. A bespoke page renders the brand's data, never hard-coded product copy.
- Storefront pages call `await connection()` inside `<Suspense>` before reading the catalog: CI builds have no database, and with `cacheComponents` a brand route can't prerender with zero static params.
- Catalog images render with `next/image` `unoptimized`, since the Supabase host isn't a configured remote pattern.
- After a save, a form's text fields come back from `values` (`preserve`); brand, categories, stock tracking and images are controlled hook state. Image fields upload on pick and submit only a hidden `*FileId`, rendered only when there is one (an empty string fails `uuid`).
- Archived records can't be restored from the panel yet.
- Admin editors use the shared modal Sheet at every width (full-height phones, wide right panel desktop). Preserve originating focus and the unchanged list; the old scroll-to-editor hook is removed. Activos is the initial filter.
- Dirty checks compare submitted values including hidden selections, snapshot on focus/pointer interaction (after Radix hidden controls mount), and recognize reverted edits. Cancelled discard prompts unmount immediately so rapid Escape cannot hit an exiting modal layer. Saves/uploads/reordering block leaving; beforeunload protects dirty/busy forms.
- Product creation includes its first presentation in one user submission, composed from existing actions (not a transaction). Retain the created product id after a presentation failure and update it on retry; do not show complete success or create a second product. Existing missing-default products are explicitly marked not visible.
- One active presentation is edited inline. Save product edits before opening presentation management; disable product fields while editing a presentation, and presentation row mutations while its form is open. Nested Cancel/discard also respects in-flight writes. Successful saves toast.
- Slugs generate from names until explicitly edited, while existing slugs stay stable. Palette/custom colors still submit one hex string. Optional searchable category selection lives under Más opciones; hidden selected ids survive search filters. Storefront grouping stays by brand.
- Up/down ordering uses existing full-record update actions, scoped by brand for products and product for presentations. Ties normalize to unique ranks; writes are sequential, not atomic, and stop on failure. Preserve all other fields. Manager brand display follows numeric order; storefront primary-first behavior is unchanged.
- Every admin mutation must go through `runCatalogMutation`, or the storefront stays stale.
- A new expected constraint or raised message needs an entry in `DATABASE_FAILURES`, or it surfaces as `unexpected`.
- Bulk inserts through PostgREST set missing columns to null unless `defaultToNull: false`.
- Bundles are designed but not built (`catalog.bundle_components`); don't add them without an ADR.
