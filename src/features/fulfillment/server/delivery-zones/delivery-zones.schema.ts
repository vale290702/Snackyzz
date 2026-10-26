import { z } from "zod";

/**
 * Columns read for a `fulfillment.delivery_zones` row.
 */
export const DELIVERY_ZONE_COLUMNS = "id, name, fee, sort_order, archived_at";

/**
 * Parses a `fulfillment.delivery_zones` row into the admin's delivery zone record.
 */
export const deliveryZoneRowSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    fee: z.int().nonnegative(),
    sort_order: z.int(),
    archived_at: z.iso.datetime({ offset: true }).nullable(),
  })
  .transform((row) => ({
    id: row.id,
    name: row.name,
    fee: row.fee,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
  }));
