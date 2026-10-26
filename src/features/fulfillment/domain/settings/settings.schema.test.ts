import { describe, expect, it } from "vitest";
import { z } from "zod";

import { DeliveryLeadHours, DeliverySlotHours } from "./settings.constants";
import { updateSettingsInputSchema } from "./settings.schema";
import { FulfillmentFieldError } from "../fields";

describe("updateSettingsInputSchema", () => {
  it("parses toggles and hours, coercing form text for hours", () => {
    expect(
      updateSettingsInputSchema.parse({
        isPickupEnabled: true,
        isDeliveryEnabled: false,
        deliveryLeadHours: "24",
        deliverySlotHours: 2,
      }),
    ).toEqual({
      isPickupEnabled: true,
      isDeliveryEnabled: false,
      deliveryLeadHours: 24,
      deliverySlotHours: 2,
    });
  });

  it("reports each field's code at the SQL limits", () => {
    const parsed = updateSettingsInputSchema.safeParse({
      isPickupEnabled: "yes",
      isDeliveryEnabled: undefined,
      deliveryLeadHours: DeliveryLeadHours.Max + 1,
      deliverySlotHours: DeliverySlotHours.Min - 1,
    });

    expect(parsed.error && z.flattenError(parsed.error).fieldErrors).toEqual({
      isPickupEnabled: [FulfillmentFieldError.ToggleInvalid],
      isDeliveryEnabled: [FulfillmentFieldError.ToggleInvalid],
      deliveryLeadHours: [FulfillmentFieldError.LeadHoursInvalid],
      deliverySlotHours: [FulfillmentFieldError.SlotHoursInvalid],
    });
  });
});
