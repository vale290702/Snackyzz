import type { HourRange } from "../../domain/hours";

/**
 * A pickup location's weekly hours after they were replaced.
 */
export type PickupLocationHours = {
  pickupLocationId: string;
  hours: HourRange[];
};

/**
 * The weekly delivery hours after they were replaced.
 */
export type DeliveryHours = {
  hours: HourRange[];
};
