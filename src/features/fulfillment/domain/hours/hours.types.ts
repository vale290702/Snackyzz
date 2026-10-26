import type { z } from "zod";

import type {
  hourRangeSchema,
  setDeliveryHoursInputSchema,
  setPickupLocationHoursInputSchema,
} from "./hours.schema";

/**
 * One opening range: an ISO weekday (1 = Monday) and `HH:MM` times.
 */
export type HourRange = z.output<typeof hourRangeSchema>;

/**
 * A validated replacement of a pickup location's weekly hours.
 */
export type SetPickupLocationHoursInput = z.output<typeof setPickupLocationHoursInputSchema>;

/**
 * A validated replacement of the weekly delivery hours.
 */
export type SetDeliveryHoursInput = z.output<typeof setDeliveryHoursInputSchema>;
