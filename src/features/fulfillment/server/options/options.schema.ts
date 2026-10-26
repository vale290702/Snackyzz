import { z } from "zod";

import { HourRanges } from "../../domain/hours";
import { HOUR_COLUMNS, hourRowSchema } from "../hours/hours.schema";

/**
 * Columns a shopper reads for a pickup location, with its hours. RLS leaves out archived
 * locations and their hours.
 */
export const PICKUP_LOCATION_DTO_COLUMNS = `id, name, address, city, map_url, instructions, pickup_location_hours(${HOUR_COLUMNS})`;

/**
 * Columns a shopper reads for a delivery zone.
 */
export const DELIVERY_ZONE_DTO_COLUMNS = "id, name, fee";

/**
 * Parses an active pickup location with its weekly hours, sorted by weekday and opening time.
 */
export const pickupLocationDtoRowSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    address: z.string(),
    city: z.string(),
    map_url: z.string().nullable(),
    instructions: z.string().nullable(),
    pickup_location_hours: z.array(hourRowSchema),
  })
  .transform((row) => ({
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    mapUrl: row.map_url,
    instructions: row.instructions,
    hours: HourRanges.sort(row.pickup_location_hours),
  }));

/**
 * Parses an active delivery zone.
 */
export const deliveryZoneDtoRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  fee: z.int().nonnegative(),
});
