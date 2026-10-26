import { z } from "zod";

import { PickupLocationTextLimit } from "./pickup-locations.constants";
import { FulfillmentFields } from "../fields";

/**
 * A pickup location's editable fields. Hours are replaced separately, as a weekly set.
 */
export const pickupLocationInputSchema = z.object({
  name: FulfillmentFields.requiredText(PickupLocationTextLimit.Name),
  address: FulfillmentFields.requiredText(PickupLocationTextLimit.Address),
  city: FulfillmentFields.requiredText(PickupLocationTextLimit.City),
  mapUrl: FulfillmentFields.mapUrl,
  instructions: FulfillmentFields.optionalText(PickupLocationTextLimit.Instructions),
  sortOrder: FulfillmentFields.sortOrder,
});

/**
 * A pickup location's editable fields with the location they replace.
 */
export const updatePickupLocationInputSchema = pickupLocationInputSchema.extend({
  id: FulfillmentFields.id,
});
