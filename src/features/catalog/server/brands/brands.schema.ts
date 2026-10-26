import { z } from "zod";

/**
 * Columns read for a `catalog.brands` row.
 */
export const BRAND_COLUMNS =
  "id, slug, name, tagline, description, label, is_primary, logo_file_id, sort_order, archived_at";

/**
 * Parses a `catalog.brands` row into the admin's brand record.
 */
export const brandRowSchema = z
  .object({
    id: z.uuid(),
    slug: z.string(),
    name: z.string(),
    tagline: z.string().nullable(),
    description: z.string().nullable(),
    label: z.string().nullable(),
    is_primary: z.boolean(),
    logo_file_id: z.uuid().nullable(),
    sort_order: z.int(),
    archived_at: z.iso.datetime({ offset: true }).nullable(),
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
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
  }));
