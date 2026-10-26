import "server-only";

import type { AdminContext } from "@/features/access";
import { CapabilityKind, defineCapability } from "@/shared/lib/capability";

import { deliveryZonesRepository } from "./delivery-zones.repository";
import {
  deliveryZoneInputSchema,
  updateDeliveryZoneInputSchema,
} from "../../domain/delivery-zones";
import { recordIdInputSchema } from "../../domain/fields";
import { FulfillmentPermission } from "../mutation";

/**
 * Creates a delivery zone.
 */
export const createDeliveryZoneCapability = defineCapability({
  name: "fulfillment.createDeliveryZone",
  kind: CapabilityKind.Mutation,
  permission: FulfillmentPermission.Manage,
  input: deliveryZoneInputSchema,
  execute: (context: AdminContext, input) => {
    return deliveryZonesRepository(context.client).insert(input, context.admin.id);
  },
});

/**
 * Replaces an active delivery zone's name, fee and position.
 */
export const updateDeliveryZoneCapability = defineCapability({
  name: "fulfillment.updateDeliveryZone",
  kind: CapabilityKind.Mutation,
  permission: FulfillmentPermission.Manage,
  input: updateDeliveryZoneInputSchema,
  execute: (context: AdminContext, { id, ...fields }) => {
    return deliveryZonesRepository(context.client).update(id, fields, context.admin.id);
  },
});

/**
 * Stops offering a delivery zone at checkout.
 */
export const archiveDeliveryZoneCapability = defineCapability({
  name: "fulfillment.archiveDeliveryZone",
  kind: CapabilityKind.Mutation,
  permission: FulfillmentPermission.Manage,
  input: recordIdInputSchema,
  execute: (context: AdminContext, { id }) => {
    return deliveryZonesRepository(context.client).archive(id, context.admin.id);
  },
});
