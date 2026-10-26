import type { z } from "zod";

import type {
  pickupLocationInputSchema,
  updatePickupLocationInputSchema,
} from "./pickup-locations.schema";

/**
 * A validated new pickup location.
 */
export type PickupLocationInput = z.output<typeof pickupLocationInputSchema>;

/**
 * A validated pickup location edit.
 */
export type UpdatePickupLocationInput = z.output<typeof updatePickupLocationInputSchema>;
