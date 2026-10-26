import { z } from "zod";

import { HourRanges } from "./hour-ranges.helper";
import { MAX_HOUR_RANGES } from "./hours.constants";
import { FulfillmentFieldError, FulfillmentFields } from "../fields";

/**
 * One opening range on a weekday; it closes after it opens, on the same day.
 */
export const hourRangeSchema = z
  .object({
    weekday: FulfillmentFields.weekday,
    opensAt: FulfillmentFields.time,
    closesAt: FulfillmentFields.time,
  })
  .refine((range) => HourRanges.toMinutes(range.closesAt) > HourRanges.toMinutes(range.opensAt), {
    error: FulfillmentFieldError.HoursInverted,
    path: ["closesAt"],
  });

/**
 * A full weekly schedule. A weekday without ranges is closed; ranges on one weekday don't overlap.
 */
export const weeklyHoursSchema = z
  .array(hourRangeSchema)
  .max(MAX_HOUR_RANGES, { error: FulfillmentFieldError.TooManyHours })
  .refine((ranges) => !HourRanges.hasOverlap(ranges), {
    error: FulfillmentFieldError.HoursOverlap,
  })
  .transform((ranges) => HourRanges.sort(ranges));

/**
 * The weekly hours that replace a pickup location's current ones.
 */
export const setPickupLocationHoursInputSchema = z.object({
  pickupLocationId: FulfillmentFields.id,
  hours: weeklyHoursSchema,
});

/**
 * The weekly hours that replace the current delivery hours.
 */
export const setDeliveryHoursInputSchema = z.object({ hours: weeklyHoursSchema });
