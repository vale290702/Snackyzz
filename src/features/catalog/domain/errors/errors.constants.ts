/**
 * Expected failures of catalog management; copy lives in `errors.catalog`.
 */
export const CatalogError = {
  BrandNotFound: "brand_not_found",
  CategoryNotFound: "category_not_found",
  ProductNotFound: "product_not_found",
  VariantNotFound: "variant_not_found",
  SlugTaken: "slug_taken",
  SkuTaken: "sku_taken",
  InvalidImage: "invalid_image",
  PrimaryBrandRequired: "primary_brand_required",
  DefaultVariantRequired: "default_variant_required",
} as const;

/**
 * An expected catalog failure.
 */
export type CatalogErrorCode = (typeof CatalogError)[keyof typeof CatalogError];
