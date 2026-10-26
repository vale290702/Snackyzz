import type { Permission } from "@/features/access";

import { CatalogError, type CatalogErrorCode } from "../../domain/errors";

/**
 * The permission every catalog capability requires.
 */
export const CatalogPermission = {
  Manage: "catalog.manage",
} as const satisfies Record<string, Permission>;

/**
 * Cache tag of every storefront catalog read; admin mutations expire it.
 */
export const CATALOG_CACHE_TAG = "catalog";

/**
 * Postgres error codes the catalog maps to expected failures.
 */
export const PostgresErrorCode = {
  RaisedException: "P0001",
  ForeignKeyViolation: "23503",
  UniqueViolation: "23505",
  CheckViolation: "23514",
} as const;

/**
 * Expected database failures, keyed by violated constraint or by the message an entry point raises.
 */
export const DATABASE_FAILURES: Readonly<Record<string, CatalogErrorCode>> = {
  brands_slug_key: CatalogError.SlugTaken,
  categories_slug_key: CatalogError.SlugTaken,
  products_brand_id_slug_key: CatalogError.SlugTaken,
  product_variants_sku_key: CatalogError.SkuTaken,
  products_brand_id_fkey: CatalogError.BrandNotFound,
  product_variants_product_id_fkey: CatalogError.ProductNotFound,
  brands_logo_file_id_fkey: CatalogError.InvalidImage,
  products_image_file_id_fkey: CatalogError.InvalidImage,
  brands_primary_not_archived_check: CatalogError.PrimaryBrandRequired,
  product_variants_default_not_archived_check: CatalogError.DefaultVariantRequired,
  file_purpose_mismatch: CatalogError.InvalidImage,
  primary_brand_required: CatalogError.PrimaryBrandRequired,
  brand_not_found: CatalogError.BrandNotFound,
  category_not_found: CatalogError.CategoryNotFound,
  variant_not_found: CatalogError.VariantNotFound,
};
