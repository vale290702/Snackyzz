import { z } from "zod";

/**
 * Columns read for a `catalog.products` row, with every category it is linked to.
 */
export const PRODUCT_COLUMNS =
  "id, brand_id, slug, name, description, badge, accent_color, image_file_id, sort_order, archived_at, product_categories(category_id)";

/**
 * Parses a `catalog.products` row into the admin's product record.
 */
export const productRowSchema = z
  .object({
    id: z.uuid(),
    brand_id: z.uuid(),
    slug: z.string(),
    name: z.string(),
    description: z.string(),
    badge: z.string().nullable(),
    accent_color: z.string(),
    image_file_id: z.uuid().nullable(),
    sort_order: z.int(),
    archived_at: z.iso.datetime({ offset: true }).nullable(),
    product_categories: z.array(z.object({ category_id: z.uuid() })),
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
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
    categoryIds: row.product_categories.map((link) => link.category_id),
  }));
