import "server-only";

import type { DatabaseClient } from "@/integrations/supabase/database-client.types";
import { Results, type Result } from "@/shared/lib/result";

import { SETTINGS_COLUMNS, settingsRowSchema } from "./settings.schema";
import type { FulfillmentSettings } from "./settings.types";
import type { FulfillmentErrorCode } from "../../domain/errors";
import type { UpdateSettingsInput } from "../../domain/settings";

/**
 * Data access for the `fulfillment.settings` singleton, acting as the signed-in admin; RLS
 * requires `fulfillment.manage` to write.
 * @param client The admin's RLS-scoped client.
 * @returns The settings update.
 */
export function settingsRepository(client: DatabaseClient) {
  return {
    update: (input: UpdateSettingsInput, adminId: string) => update(client, input, adminId),
  };
}

/**
 * Updates the settings singleton, which the fulfillment data migration creates.
 * @param client The admin's client.
 * @param input The validated settings.
 * @param adminId The admin editing them.
 * @returns The settings.
 * @throws When the database fails or the singleton is missing.
 */
async function update(
  client: DatabaseClient,
  input: UpdateSettingsInput,
  adminId: string,
): Promise<Result<FulfillmentSettings, FulfillmentErrorCode>> {
  const { data, error } = await client
    .schema("fulfillment")
    .from("settings")
    .update({
      is_pickup_enabled: input.isPickupEnabled,
      is_delivery_enabled: input.isDeliveryEnabled,
      delivery_lead_hours: input.deliveryLeadHours,
      delivery_slot_hours: input.deliverySlotHours,
      updated_by: adminId,
    })
    .eq("id", true)
    .select(SETTINGS_COLUMNS)
    .single();
  if (error) {
    throw error;
  }

  return Results.ok(settingsRowSchema.parse(data));
}
