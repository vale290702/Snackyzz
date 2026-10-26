import { describe, expect, it } from "vitest";
import { z } from "zod";

import { DeliveryZoneTextLimit } from "./delivery-zones.constants";
import { deliveryZoneInputSchema, updateDeliveryZoneInputSchema } from "./delivery-zones.schema";
import { FulfillmentFieldError } from "../fields";

describe("deliveryZoneInputSchema", () => {
  it("parses a zone, coercing form text", () => {
    expect(
      deliveryZoneInputSchema.parse({ name: " Escazú ", fee: "1500", sortOrder: "2" }),
    ).toEqual({
      name: "Escazú",
      fee: 1500,
      sortOrder: 2,
    });
  });

  it("reports each field's code", () => {
    const parsed = deliveryZoneInputSchema.safeParse({
      name: "a".repeat(DeliveryZoneTextLimit.Name + 1),
      fee: -5,
    });

    expect(parsed.error && z.flattenError(parsed.error).fieldErrors).toEqual({
      name: [FulfillmentFieldError.TooLong],
      fee: [FulfillmentFieldError.FeeInvalid],
    });
  });
});

describe("updateDeliveryZoneInputSchema", () => {
  it("requires the zone's id", () => {
    const parsed = updateDeliveryZoneInputSchema.safeParse({ name: "Escazú", fee: 1500 });

    expect(parsed.error && z.flattenError(parsed.error).fieldErrors).toEqual({
      id: [FulfillmentFieldError.ReferenceInvalid],
    });
  });
});
