import { z } from "zod";

/**
 * Columns read for a `fulfillment.pickup_locations` row.
 */
export const PICKUP_LOCATION_COLUMNS =
  "id, name, address, city, map_url, instructions, sort_order, archived_at";

/**
 * Parses a `fulfillment.pickup_locations` row into the admin's pickup location record.
 */
export const pickupLocationRowSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    address: z.string(),
    city: z.string(),
    map_url: z.string().nullable(),
    instructions: z.string().nullable(),
    sort_order: z.int(),
    archived_at: z.iso.datetime({ offset: true }).nullable(),
  })
  .transform((row) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    mapUrl: row.map_url,
    instructions: row.instructions,
    sortOrder: row.sort_order,
    archivedAt: row.archived_at,
  }));
