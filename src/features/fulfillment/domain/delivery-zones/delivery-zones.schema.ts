import { z } from "zod";

import { DeliveryZoneTextLimit } from "./delivery-zones.constants";
import { FulfillmentFields } from "../fields";

/**
 * A delivery zone's editable fields.
 */
export const deliveryZoneInputSchema = z.object({
  name: FulfillmentFields.requiredText(DeliveryZoneTextLimit.Name),
  fee: FulfillmentFields.fee,
  sortOrder: FulfillmentFields.sortOrder,
});

/**
 * A delivery zone's editable fields with the zone they replace.
 */
export const updateDeliveryZoneInputSchema = deliveryZoneInputSchema.extend({
  id: FulfillmentFields.id,
});
