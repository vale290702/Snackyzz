import { z } from "zod";

import { DeliveryLeadHours, DeliverySlotHours } from "./settings.constants";
import { FulfillmentFieldError, FulfillmentFields } from "../fields";

/**
 * The settings admins edit: which methods checkout offers and how delivery windows are cut. The
 * time zone is not editable.
 */
export const updateSettingsInputSchema = z.object({
  isPickupEnabled: FulfillmentFields.toggle,
  isDeliveryEnabled: FulfillmentFields.toggle,
  deliveryLeadHours: FulfillmentFields.hours(
    DeliveryLeadHours.Min,
    DeliveryLeadHours.Max,
    FulfillmentFieldError.LeadHoursInvalid,
  ),
  deliverySlotHours: FulfillmentFields.hours(
    DeliverySlotHours.Min,
    DeliverySlotHours.Max,
    FulfillmentFieldError.SlotHoursInvalid,
  ),
});
