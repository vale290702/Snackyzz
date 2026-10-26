import "server-only";

import { z } from "zod";

import type { DatabaseClient } from "@/integrations/supabase/database-client.types";

const availabilityRowSchema = z
  .object({ variant_id: z.uuid(), is_available: z.boolean() })
  .transform((row) => ({ variantId: row.variant_id, isAvailable: row.is_available }));

/**
 * Public boolean-only availability, with catalog visibility enforced by SQL.
 * @param client An anonymous client without request cookies.
 * @returns Availability reads for the selected stock scope.
 */
export function availabilityRepository(client: DatabaseClient) {
  return {
    get: (variantIds: string[], pickupLocationId: string | null) =>
      get(client, variantIds, pickupLocationId),
  };
}

async function get(client: DatabaseClient, variantIds: string[], pickupLocationId: string | null) {
  const { data, error } = await client.schema("inventory").rpc("variant_availability", {
    p_variant_ids: variantIds,
    ...(pickupLocationId === null ? {} : { p_pickup_location_id: pickupLocationId }),
  });
  if (error) {
    throw error;
  }

  return data.map((row) => availabilityRowSchema.parse(row));
}
