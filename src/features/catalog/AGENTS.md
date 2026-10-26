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
- UI: `BrandPage({ shelf })` (bespoke page by slug, else the generic one), `ProductGrid`, `ProductPurchaseProvider({ purchase })` (the add-to-cart seam), `CatalogManager({ data })`.
- Types: admin records `Brand`, `Category`, `Product` (with `categoryIds`), `Variant`; `ManagedBrand`, `ManagedProduct`, `CatalogManagerData`; DTOs `BrandDto`, `CategoryDto`, `ProductDto`, `VariantDto`, `StorefrontCatalog`, `BrandShelf`; `CatalogErrorCode`.

## Layout

- `domain/fields/`: `CatalogFields` (slug, accent color, price, sort order, required/optional text, ids) and `CatalogFieldError` codes; limits mirror the SQL checks. `recordIdInputSchema` for archive / set-primary / set-default.
- `domain/<brands|categories|products|variants>/`: input schemas (create, and update with `id`) and text limits. Inputs never carry `isPrimary` or `isDefault`.
- `domain/errors/`: `CatalogError`; Spanish copy for both code sets in `errors.catalog`.
- `server/<brands|categories|products|variants>/`: row schema (snake_case → record), repository, capabilities, actions.
- `domain/images/`: `CatalogImagePurpose` (`product_image`, `brand_logo`), browser-safe.
- `domain/variants/variant-selection.helper.ts`: `VariantSelection` (default, chosen with fallback, whether there's a choice). `domain/manager/`: manager views, status filters, `RecordAction`, `ManagerRecords` (status and parent filters).
- `server/mutation/`: `CatalogPermission`, `CATALOG_CACHE_TAG`, `CatalogImagePurpose` (re-exported from domain), `runCatalogMutation` (admin context → capability → `updateTag("catalog")`), `verifyCatalogImage`, `CatalogResults` (PostgREST response → `Result`: the parsed row, or a code for known constraint names and raised messages; anything else is rethrown).
- `server/storefront/`: anon repository, row schemas, `StorefrontAssembly` (pure), `listStorefrontCatalog`.
- `server/manager/`: `managerRepository` (every row, archived included) and `getCatalogManager`.
- `server/images/images.actions.ts`: `createCatalogImageUploadAction` / `registerCatalogImageUploadAction`, media's upload actions restricted to the catalog purposes. Client hooks call these because media's index also exports server-only reads.
- `server/testing/`: integration-test helpers only (in-memory cookies, demo admins, file fixtures).
- `hooks/storefront/`: `useProductCard`, `useProductDialog`, `useProductPurchase` (+ `ProductPurchaseContext`). `hooks/manager/`: `useCatalogManager`, one form hook per record (`useBrandForm`, `useCategoryForm`, `useProductForm`, `useVariantForm`), `useVariantsSection`, `useRecordAction` / `useArchiveRecord`, `useCatalogImageUpload`.
- `ui/storefront/`: `ProductGrid`, `ProductCard`, `ProductDialog`, `VariantPicker`, `BrandHeader`, `BrandShelf` and shelf parts; `ProductLook` (`classic` / `editorial`) picks the cva variants. `ui/brand-pages/`: `BrandPage`, `GenericBrandPage`, `BakingStereoPage`, `BESPOKE_BRAND_PAGES`. `ui/manager/`: `CatalogManager` and its rows, editor and forms. `ui/testing/`: `CatalogRecords` builders for hook and component tests.

## Invariants

- Exactly one brand is primary while any brand is active: a partial unique index allows at most one, a deferrable constraint trigger refuses none, and the primary brand cannot be archived. The first brand created becomes primary; afterwards only `set_primary_brand` moves it. Brand copy is data; never hard-code brand names or slugs in logic.
- At most one default variant per product (partial unique index); the default can't be archived. The first variant created becomes the default; `set_default_variant` swaps it. A product without a default variant (no variants yet) is not on the storefront.
- Carts, orders and stock reference **variants**. One variant renders as a simple product; the picker appears with 2+.
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
- Every admin mutation must go through `runCatalogMutation`, or the storefront stays stale.
- A new expected constraint or raised message needs an entry in `DATABASE_FAILURES`, or it surfaces as `unexpected`.
- Bulk inserts through PostgREST set missing columns to null unless `defaultToNull: false`.
- Bundles are designed but not built (`catalog.bundle_components`); don't add them without an ADR.
