import { describe, expect, it } from "vitest";
import { z } from "zod";

import { PickupLocationTextLimit } from "./pickup-locations.constants";
import {
  pickupLocationInputSchema,
  updatePickupLocationInputSchema,
} from "./pickup-locations.schema";
import { FulfillmentFieldError } from "../fields";

describe("pickupLocationInputSchema", () => {
  it("parses a location with optional fields left out", () => {
    expect(
      pickupLocationInputSchema.parse({
        name: " Escazú ",
        address: "Del parque 200 m",
        city: "Escazú",
      }),
    ).toEqual({
      name: "Escazú",
      address: "Del parque 200 m",
      city: "Escazú",
      mapUrl: null,
      instructions: null,
      sortOrder: 0,
    });
  });

  it("reports each field's code", () => {
    const parsed = pickupLocationInputSchema.safeParse({
      name: "",
      address: "a".repeat(PickupLocationTextLimit.Address + 1),
      city: " ",
      mapUrl: "http://maps.example.com",
      instructions: "a".repeat(PickupLocationTextLimit.Instructions + 1),
      sortOrder: -1,
    });

    expect(parsed.error && z.flattenError(parsed.error).fieldErrors).toEqual({
      name: [FulfillmentFieldError.Required],
      address: [FulfillmentFieldError.TooLong],
      city: [FulfillmentFieldError.Required],
      mapUrl: [FulfillmentFieldError.MapUrlInvalid],
      instructions: [FulfillmentFieldError.TooLong],
      sortOrder: [FulfillmentFieldError.SortOrderInvalid],
    });
  });
});

describe("updatePickupLocationInputSchema", () => {
  it("requires the location's id", () => {
    const parsed = updatePickupLocationInputSchema.safeParse({
      name: "Escazú",
      address: "Del parque 200 m",
      city: "Escazú",
    });

    expect(parsed.error && z.flattenError(parsed.error).fieldErrors).toEqual({
      id: [FulfillmentFieldError.ReferenceInvalid],
    });
  });
});
