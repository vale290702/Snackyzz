import { z } from "zod";

/**
 * Columns read for a `catalog.categories` row.
 */
export const CATEGORY_COLUMNS = "id, slug, name, sort_order, archived_at";

/**
 * Parses a `catalog.categories` row into the admin's category record.
 */
export const categoryRowSchema = z
  .object({
    id: z.uuid(),
    slug: z.string(),
    name: z.string(),
    sort_order: z.int(),
    archived_at: z.iso.datetime({ offset: true }).nullable(),
  })
  .transform((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
  }));
