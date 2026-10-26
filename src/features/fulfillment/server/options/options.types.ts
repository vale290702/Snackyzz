import type { z } from "zod";

import type { deliveryZoneDtoRowSchema, pickupLocationDtoRowSchema } from "./options.schema";
import type { HourRange } from "../../domain/hours";
import type { FulfillmentSettings } from "../settings/settings.types";

/**
 * An active pickup location as shoppers see it, with its weekly hours.
 */
export type PickupLocationDto = z.output<typeof pickupLocationDtoRowSchema>;

/**
 * An active delivery zone and its flat fee in colones.
 */
export type DeliveryZoneDto = z.output<typeof deliveryZoneDtoRowSchema>;

/**
 * Everything checkout needs to offer pickup and delivery. Lists hold active rows whatever the
 * settings say; checkout reads `settings` to decide which methods to offer.
 */
export type FulfillmentOptions = {
  settings: FulfillmentSettings;
  pickupLocations: PickupLocationDto[];
  deliveryZones: DeliveryZoneDto[];
  deliveryHours: HourRange[];
};
