import { describe, expect, it } from "vitest";
import { z } from "zod";

import { MAX_HOUR_RANGES } from "./hours.constants";
import { setDeliveryHoursInputSchema, setPickupLocationHoursInputSchema } from "./hours.schema";
import { FulfillmentFieldError } from "../fields";

describe("setDeliveryHoursInputSchema", () => {
  it("parses a weekly schedule sorted by weekday and opening time", () => {
    const parsed = setDeliveryHoursInputSchema.parse({
      hours: [
        { weekday: "2", opensAt: "14:00", closesAt: "18:00" },
        { weekday: 1, opensAt: "09:00", closesAt: "12:00" },
        { weekday: 2, opensAt: "09:00", closesAt: "12:00" },
      ],
    });

    expect(parsed.hours).toEqual([
      { weekday: 1, opensAt: "09:00", closesAt: "12:00" },
      { weekday: 2, opensAt: "09:00", closesAt: "12:00" },
      { weekday: 2, opensAt: "14:00", closesAt: "18:00" },
    ]);
  });

  it("accepts an empty schedule and ranges that touch", () => {
    expect(setDeliveryHoursInputSchema.parse({ hours: [] }).hours).toEqual([]);
    expect(
      setDeliveryHoursInputSchema.safeParse({
        hours: [
          { weekday: 1, opensAt: "09:00", closesAt: "12:00" },
          { weekday: 1, opensAt: "12:00", closesAt: "15:00" },
        ],
      }).success,
    ).toBe(true);
  });

  it("reports hours_inverted for ranges that close before they open", () => {
    const parsed = setDeliveryHoursInputSchema.safeParse({
      hours: [{ weekday: 1, opensAt: "18:00", closesAt: "09:00" }],
    });

    expect(parsed.error && z.flattenError(parsed.error).fieldErrors).toEqual({
      hours: [FulfillmentFieldError.HoursInverted],
    });
  });

  it("reports hours_overlap for ranges sharing time on one weekday", () => {
    const parsed = setDeliveryHoursInputSchema.safeParse({
      hours: [
        { weekday: 3, opensAt: "09:00", closesAt: "13:00" },
        { weekday: 3, opensAt: "12:00", closesAt: "15:00" },
      ],
    });

    expect(parsed.error && z.flattenError(parsed.error).fieldErrors).toEqual({
      hours: [FulfillmentFieldError.HoursOverlap],
    });
  });

  it("reports too_many_hours past the weekly limit", () => {
    const hours = Array.from({ length: MAX_HOUR_RANGES + 1 }, (_, index) => ({
      weekday: (index % 7) + 1,
      opensAt: "09:00",
      closesAt: "10:00",
    }));
    const parsed = setDeliveryHoursInputSchema.safeParse({ hours });

    expect(parsed.error?.issues[0]?.message).toBe(FulfillmentFieldError.TooManyHours);
  });
});

describe("setPickupLocationHoursInputSchema", () => {
  it("requires the pickup location", () => {
    const parsed = setPickupLocationHoursInputSchema.safeParse({ hours: [] });

    expect(parsed.error && z.flattenError(parsed.error).fieldErrors).toEqual({
      pickupLocationId: [FulfillmentFieldError.ReferenceInvalid],
    });
  });
});
