# features/catalog

## Purpose

What we sell: brands (Snackyzz is primary; collabs are rows), categories, products, variants and their price history. Storefront catalog reads and admin catalog management.

## Owns / does not own

- **Owns:** schema `catalog` (brands, categories, products, product_categories, product_variants, variant_price_history), storefront catalog reads, admin capabilities and actions; later the shop and brand pages' product UI and admin `CatalogManager`.
- **Does not own:** stock (`inventory`), image storage (`media`; we hold `*_file_id`), themes (`themes`).

## Public API (`index.ts`)

- Storefront: `listStorefrontCatalog(brandSlug?)` → `StorefrontCatalog` (`brands: BrandDto[]` primary first, `categories: CategoryDto[]`, `products: ProductDto[]` with image URLs and `variants: VariantDto[]` in sort order, each flagged `isDefault`). `'use cache'` + `cacheTag("catalog")` + `cacheLife("max")`, anon client. A malformed or unknown slug lists no brands or products.
- Admin actions (each `ActionResult<Record, CatalogErrorCode>`): `createBrandAction`, `updateBrandAction`, `archiveBrandAction`, `setPrimaryBrandAction`; `createCategoryAction`, `updateCategoryAction`, `archiveCategoryAction`; `createProductAction`, `updateProductAction`, `archiveProductAction`; `createVariantAction`, `updateVariantAction`, `archiveVariantAction`, `setDefaultVariantAction`.
- Types: admin records `Brand`, `Category`, `Product` (with `categoryIds`), `Variant`; DTOs `BrandDto`, `CategoryDto`, `ProductDto`, `VariantDto`, `StorefrontCatalog`; `CatalogErrorCode`.

## Layout

- `domain/fields/`: `CatalogFields` (slug, accent color, price, sort order, required/optional text, ids) and `CatalogFieldError` codes; limits mirror the SQL checks. `recordIdInputSchema` for archive / set-primary / set-default.
- `domain/<brands|categories|products|variants>/`: input schemas (create, and update with `id`) and text limits. Inputs never carry `isPrimary` or `isDefault`.
- `domain/errors/`: `CatalogError`; Spanish copy for both code sets in `errors.catalog`.
- `server/<brands|categories|products|variants>/`: row schema (snake_case → record), repository, capabilities, actions.
- `server/mutation/`: `CatalogPermission`, `CATALOG_CACHE_TAG`, `CatalogImagePurpose`, `runCatalogMutation` (admin context → capability → `updateTag("catalog")`), `verifyCatalogImage`, `CatalogResults` (PostgREST response → `Result`: the parsed row, or a code for known constraint names and raised messages; anything else is rethrown).
- `server/storefront/`: anon repository, row schemas, `StorefrontAssembly` (pure), `listStorefrontCatalog`.
- `server/testing/`: integration-test helpers only (in-memory cookies, demo admins, file fixtures).

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

- Unit: field and input schemas (each code on its field), `CatalogResults`, `StorefrontAssembly`; `messages.test.ts` covers `errors.catalog`.
- Integration (`*.int.test.ts`, local stack): every action for visitor / staff / owner, image purposes, taken slugs and SKUs, archive rules, primary and default swaps, price history, storefront filtering and image URLs. Catalog rows can't be deleted, so tests use unique slugs and leave archived fixtures behind (`supabase db reset` clears them).
- pgTAP `catalog.test.sql`: shape, grants, every policy × role, constraints, the one-primary / one-default invariants, file purposes, entry points and the price-history trigger.

## Follow-ups

- Admin `CatalogManager` UI and forms (hooks via `useFormAction`; checkbox and file fields need `FormInput` extensions), storefront `ProductGrid` / `ProductCard` / `ProductDialog` / `BrandHeader` and pages.
- `getVariantsForPricing(ids)` for cart and checkout (pricing itself is resolved in SQL).
- Unarchiving, reordering in bulk, and exporting capabilities to `admin-chat`.

## Gotchas

- Bespoke collab pages (e.g. Baking Stereo's hero) will live in `ui/brand-pages/<slug>.tsx`, looked up by slug, falling back to the generic brand page.
- Every admin mutation must go through `runCatalogMutation`, or the storefront stays stale.
- A new expected constraint or raised message needs an entry in `DATABASE_FAILURES`, or it surfaces as `unexpected`.
- Bulk inserts through PostgREST set missing columns to null unless `defaultToNull: false`.
- Bundles are designed but not built (`catalog.bundle_components`); don't add them without an ADR.
