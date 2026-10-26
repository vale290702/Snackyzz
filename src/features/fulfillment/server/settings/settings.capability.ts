import "server-only";

import type { AdminContext } from "@/features/access";
import { CapabilityKind, defineCapability } from "@/shared/lib/capability";

import { settingsRepository } from "./settings.repository";
import { updateSettingsInputSchema } from "../../domain/settings";
import { FulfillmentPermission } from "../mutation";

/**
 * Turns pickup and delivery on or off and sets the delivery notice and window length.
 */
export const updateFulfillmentSettingsCapability = defineCapability({
  name: "fulfillment.updateSettings",
  kind: CapabilityKind.Mutation,
  permission: FulfillmentPermission.Manage,
  input: updateSettingsInputSchema,
  execute: (context: AdminContext, input) => {
    return settingsRepository(context.client).update(input, context.admin.id);
  },
});
