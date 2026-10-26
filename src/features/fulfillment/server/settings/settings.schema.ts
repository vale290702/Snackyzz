import { z } from "zod";

/**
 * Columns read for the `fulfillment.settings` singleton.
 */
export const SETTINGS_COLUMNS =
  "is_pickup_enabled, is_delivery_enabled, delivery_lead_hours, delivery_slot_hours, timezone";

/**
 * Parses the `fulfillment.settings` singleton.
 */
export const settingsRowSchema = z
  .object({
    is_pickup_enabled: z.boolean(),
    is_delivery_enabled: z.boolean(),
    delivery_lead_hours: z.int(),
    delivery_slot_hours: z.int(),
    timezone: z.string(),
  })
  .transform((row) => ({
    isPickupEnabled: row.is_pickup_enabled,
    isDeliveryEnabled: row.is_delivery_enabled,
    deliveryLeadHours: row.delivery_lead_hours,
    deliverySlotHours: row.delivery_slot_hours,
    timezone: row.timezone,
  }));
