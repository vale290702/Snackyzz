import "server-only";

import type { Database, DatabaseClient } from "@/integrations/supabase/database-client.types";
import type { Result } from "@/shared/lib/result";

import { PICKUP_LOCATION_COLUMNS, pickupLocationRowSchema } from "./pickup-locations.schema";
import type { PickupLocation } from "./pickup-locations.types";
import { FulfillmentError, type FulfillmentErrorCode } from "../../domain/errors";
import type { PickupLocationInput } from "../../domain/pickup-locations";
import { FulfillmentResults } from "../mutation";

type PickupLocationResult = Result<PickupLocation, FulfillmentErrorCode>;

/**
 * Data access for `fulfillment.pickup_locations`, acting as the signed-in admin; RLS requires
 * `fulfillment.manage`.
 * @param client The admin's RLS-scoped client.
 * @returns Pickup location writes that return parsed locations or expected failures.
 */
export function pickupLocationsRepository(client: DatabaseClient) {
  return {
    insert: (input: PickupLocationInput, adminId: string) => insert(client, input, adminId),
    update: (id: string, input: PickupLocationInput, adminId: string) =>
      update(client, id, input, adminId),
    archive: (id: string, adminId: string) => archive(client, id, adminId),
  };
}

/**
 * Creates a pickup location attributed to the admin. It has no hours, so it is closed until
 * they are set.
 * @param client The admin's client.
 * @param input The validated location.
 * @param adminId The admin creating it.
 * @returns The location.
 * @throws When the database fails unexpectedly.
 */
async function insert(
  client: DatabaseClient,
  input: PickupLocationInput,
  adminId: string,
): Promise<PickupLocationResult> {
  const response = await pickupLocations(client)
    .insert({ ...toRow(input), created_by: adminId, updated_by: adminId })
    .select(PICKUP_LOCATION_COLUMNS)
    .single();

  return FulfillmentResults.fromResponse(
    response,
    pickupLocationRowSchema,
    FulfillmentError.PickupLocationNotFound,
  );
}

/**
 * Replaces an active pickup location's fields.
 * @param client The admin's client.
 * @param id The location.
 * @param input The validated fields.
 * @param adminId The admin editing it.
 * @returns The location, or `pickup_location_not_found` when it is missing or archived.
 * @throws When the database fails unexpectedly.
 */
async function update(
  client: DatabaseClient,
  id: string,
  input: PickupLocationInput,
  adminId: string,
): Promise<PickupLocationResult> {
  const response = await pickupLocations(client)
    .update({ ...toRow(input), updated_by: adminId })
    .eq("id", id)
    .is("archived_at", null)
    .select(PICKUP_LOCATION_COLUMNS)
    .maybeSingle();

  return FulfillmentResults.fromResponse(
    response,
    pickupLocationRowSchema,
    FulfillmentError.PickupLocationNotFound,
  );
}

/**
 * Archives an active pickup location; checkout stops offering it, and past orders keep it.
 * @param client The admin's client.
 * @param id The location.
 * @param adminId The admin archiving it.
 * @returns The archived location, or `pickup_location_not_found`.
 * @throws When the database fails unexpectedly.
 */
async function archive(
  client: DatabaseClient,
  id: string,
  adminId: string,
): Promise<PickupLocationResult> {
  const response = await pickupLocations(client)
    .update({ archived_at: new Date().toISOString(), updated_by: adminId })
    .eq("id", id)
    .is("archived_at", null)
    .select(PICKUP_LOCATION_COLUMNS)
    .maybeSingle();

  return FulfillmentResults.fromResponse(
    response,
    pickupLocationRowSchema,
    FulfillmentError.PickupLocationNotFound,
  );
}

function pickupLocations(client: DatabaseClient) {
  return client.schema("fulfillment").from("pickup_locations");
}

function toRow(
  input: PickupLocationInput,
): Database["fulfillment"]["Tables"]["pickup_locations"]["Insert"] {
  return {
    name: input.name,
    address: input.address,
    city: input.city,
    map_url: input.mapUrl,
    instructions: input.instructions,
    sort_order: input.sortOrder,
  };
}
