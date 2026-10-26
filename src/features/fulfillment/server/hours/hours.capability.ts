import "server-only";

import type { AdminContext } from "@/features/access";
import { CapabilityKind, defineCapability } from "@/shared/lib/capability";

import { hoursRepository } from "./hours.repository";
import { setDeliveryHoursInputSchema, setPickupLocationHoursInputSchema } from "../../domain/hours";
import { FulfillmentPermission } from "../mutation";

/**
 * Replaces a pickup location's weekly hours; a weekday without ranges is closed.
 */
export const setPickupLocationHoursCapability = defineCapability({
  name: "fulfillment.setPickupLocationHours",
  kind: CapabilityKind.Mutation,
  permission: FulfillmentPermission.Manage,
  input: setPickupLocationHoursInputSchema,
  execute: (context: AdminContext, { pickupLocationId, hours }) => {
    return hoursRepository(context.client).setPickupLocationHours(pickupLocationId, hours);
  },
});

/**
 * Replaces the weekly delivery hours that delivery windows are cut from.
 */
export const setDeliveryHoursCapability = defineCapability({
  name: "fulfillment.setDeliveryHours",
  kind: CapabilityKind.Mutation,
  permission: FulfillmentPermission.Manage,
  input: setDeliveryHoursInputSchema,
  execute: (context: AdminContext, { hours }) => {
    return hoursRepository(context.client).setDeliveryHours(hours);
  },
});
