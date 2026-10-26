import { z } from "zod";

/**
 * Columns read for a `catalog.product_variants` row.
 */
export const VARIANT_COLUMNS =
  "id, product_id, sku, name, price, is_default, is_stock_tracked, sort_order, archived_at";

/**
 * Parses a `catalog.product_variants` row into the admin's variant record.
 */
export const variantRowSchema = z
  .object({
    id: z.uuid(),
    product_id: z.uuid(),
    sku: z.string().nullable(),
    name: z.string(),
    price: z.int().positive(),
    is_default: z.boolean(),
    is_stock_tracked: z.boolean(),
    sort_order: z.int(),
    archived_at: z.iso.datetime({ offset: true }).nullable(),
  })
  .transform((row) => ({
    id: row.id,
    productId: row.product_id,
    sku: row.sku,
    name: row.name,
    price: row.price,
    isDefault: row.is_default,
    isStockTracked: row.is_stock_tracked,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
  }));

/**
 * Parses an active product with its default variant, if any, to decide a new variant's default.
 */
export const productDefaultRowSchema = z
  .object({ id: z.uuid(), product_variants: z.array(z.object({ id: z.uuid() })) })
  .transform((row) => ({ hasDefault: row.product_variants.length > 0 }));
