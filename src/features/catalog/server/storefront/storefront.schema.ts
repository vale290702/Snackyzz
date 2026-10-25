import { z } from "zod";

/**
 * Columns a shopper reads for a brand.
 */
export const STOREFRONT_BRAND_COLUMNS =
  "id, slug, name, tagline, description, label, is_primary, logo_file_id";

/**
 * Columns a shopper reads for a category.
 */
export const STOREFRONT_CATEGORY_COLUMNS = "id, slug, name";

/**
 * Columns a shopper reads for a product, with its category links and variants. RLS leaves out
 * archived variants and links to archived categories.
 */
export const STOREFRONT_PRODUCT_COLUMNS =
  "id, brand_id, slug, name, description, badge, accent_color, image_file_id, product_categories(category_id), product_variants(id, sku, name, price, is_default, is_stock_tracked)";

/**
 * Parses an active brand as the storefront shows it.
 */
export const storefrontBrandRowSchema = z
  .object({
    id: z.uuid(),
    slug: z.string(),
    name: z.string(),
    tagline: z.string().nullable(),
    description: z.string().nullable(),
    label: z.string().nullable(),
    is_primary: z.boolean(),
    logo_file_id: z.uuid().nullable(),
  })
  .transform((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    label: row.label,
    isPrimary: row.is_primary,
    logoFileId: row.logo_file_id,
  }));

/**
 * Parses an active category.
 */
export const storefrontCategoryRowSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
});

/**
 * Parses an active variant as the storefront shows it.
 */
export const storefrontVariantRowSchema = z
  .object({
    id: z.uuid(),
    sku: z.string().nullable(),
    name: z.string(),
    price: z.int().positive(),
    is_default: z.boolean(),
    is_stock_tracked: z.boolean(),
  })
  .transform((row) => ({
    id: row.id,
    sku: row.sku,
    name: row.name,
    price: row.price,
    isDefault: row.is_default,
    isStockTracked: row.is_stock_tracked,
  }));

/**
 * Parses an active product with its category ids and active variants.
 */
export const storefrontProductRowSchema = z
  .object({
    id: z.uuid(),
    brand_id: z.uuid(),
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    badge: z.string().nullable(),
    accent_color: z.string(),
    image_file_id: z.uuid().nullable(),
    product_categories: z.array(z.object({ category_id: z.uuid() })),
    product_variants: z.array(storefrontVariantRowSchema),
  })
  .transform((row) => ({
    id: row.id,
    brandId: row.brand_id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    badge: row.badge,
    accentColor: row.accent_color,
    imageFileId: row.image_file_id,
    categoryIds: row.product_categories.map((link) => link.category_id),
    variants: row.product_variants,
  }));
