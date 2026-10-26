import type { z } from "zod";

import type { pickupLocationRowSchema } from "./pickup-locations.schema";

/**
 * A pickup location as fulfillment management sees it, archived or not.
 */
export type PickupLocation = z.output<typeof pickupLocationRowSchema>;
