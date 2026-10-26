import type { z } from "zod";

import type { deliveryZoneRowSchema } from "./delivery-zones.schema";

/**
 * A delivery zone as fulfillment management sees it, archived or not.
 */
export type DeliveryZone = z.output<typeof deliveryZoneRowSchema>;
