import type { z } from "zod";

import type {
  deliveryZoneInputSchema,
  updateDeliveryZoneInputSchema,
} from "./delivery-zones.schema";

/**
 * A validated new delivery zone.
 */
export type DeliveryZoneInput = z.output<typeof deliveryZoneInputSchema>;

/**
 * A validated delivery zone edit.
 */
export type UpdateDeliveryZoneInput = z.output<typeof updateDeliveryZoneInputSchema>;
