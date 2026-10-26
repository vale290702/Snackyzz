import "server-only";

import type { AdminContext } from "@/features/access";
import { CapabilityKind, defineCapability } from "@/shared/lib/capability";

import { pickupLocationsRepository } from "./pickup-locations.repository";
import { recordIdInputSchema } from "../../domain/fields";
import {
  pickupLocationInputSchema,
  updatePickupLocationInputSchema,
} from "../../domain/pickup-locations";
import { FulfillmentPermission } from "../mutation";

/**
 * Creates a pickup location.
 */
export const createPickupLocationCapability = defineCapability({
  name: "fulfillment.createPickupLocation",
  kind: CapabilityKind.Mutation,
  permission: FulfillmentPermission.Manage,
  input: pickupLocationInputSchema,
  execute: (context: AdminContext, input) => {
    return pickupLocationsRepository(context.client).insert(input, context.admin.id);
  },
});

/**
 * Replaces an active pickup location's name, address, map link, instructions and position.
 */
export const updatePickupLocationCapability = defineCapability({
  name: "fulfillment.updatePickupLocation",
  kind: CapabilityKind.Mutation,
  permission: FulfillmentPermission.Manage,
  input: updatePickupLocationInputSchema,
  execute: (context: AdminContext, { id, ...fields }) => {
    return pickupLocationsRepository(context.client).update(id, fields, context.admin.id);
  },
});

/**
 * Stops offering a pickup location at checkout.
 */
export const archivePickupLocationCapability = defineCapability({
  name: "fulfillment.archivePickupLocation",
  kind: CapabilityKind.Mutation,
  permission: FulfillmentPermission.Manage,
  input: recordIdInputSchema,
  execute: (context: AdminContext, { id }) => {
    return pickupLocationsRepository(context.client).archive(id, context.admin.id);
  },
});
