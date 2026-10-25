# features/catalog

## Purpose
What we sell: brands (Snackyzz is primary; collabs are rows), categories, products, variants and their price history. Storefront catalog pages and admin catalog management.

## Owns / does not own
- **Owns:** schema `catalog` (brands, categories, products, product_categories, product_variants, variant_price_history), the shop and brand pages' product UI, and admin CRUD.
- **Does not own:** stock (`inventory`), image storage (`media`; we hold `*_file_id`), themes (`themes`).

## Public API (`index.ts`)
- Types: `BrandDto`, `ProductDto`, `VariantDto`, `CategoryDto`
- Server: `listStorefrontCatalog(brandSlug?)` (cached, tag `catalog`), `getVariantsForPricing(ids)` (types only, since pricing is resolved in SQL), admin actions `saveProductAction`, `saveVariantAction`, `archiveProductAction`, `saveBrandAction`, `saveCategoryAction`
- UI: `ProductGrid`, `ProductCard`, `ProductDialog`, `BrandHeader`, admin `CatalogManager`

## Invariants
- Exactly one brand has `is_primary = true`. Brand copy (title, tagline, label) is data; never hard-code brand names or slugs in logic.
- Every product has exactly one default variant. Carts, orders and stock reference **variants**.
- A product with one variant renders as a simple product (today's look); the variant picker appears only with 2+.
- Archived rows disappear from the storefront but stay referenced by past orders.
- Price changes are recorded in `variant_price_history` by trigger; don't write it manually.

## Dependencies
`media` (image URLs), `access` (`requirePermission("catalog.manage")`).

## Testing
- Unit: catalog grouping, product → card view model.
- Integration: admin save/archive actions with RLS (owner allowed, staff denied).
- pgTAP: single primary brand, single default variant, price history trigger.

## Gotchas
- Bespoke collab pages (e.g. Baking Stereo's hero) live in `ui/brand-pages/<slug>.tsx` and are looked up by slug, falling back to the generic brand page.
- Call `updateTag("catalog")` after every admin mutation, or the storefront stays stale.
- Bundles are designed but not built (`catalog.bundle_components`); don't add them without an ADR.
