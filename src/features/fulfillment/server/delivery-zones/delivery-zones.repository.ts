import "server-only";

import type { Database, DatabaseClient } from "@/integrations/supabase/database-client.types";
import type { Result } from "@/shared/lib/result";

import { DELIVERY_ZONE_COLUMNS, deliveryZoneRowSchema } from "./delivery-zones.schema";
import type { DeliveryZone } from "./delivery-zones.types";
import type { DeliveryZoneInput } from "../../domain/delivery-zones";
import { FulfillmentError, type FulfillmentErrorCode } from "../../domain/errors";
import { FulfillmentResults } from "../mutation";

type DeliveryZoneResult = Result<DeliveryZone, FulfillmentErrorCode>;

/**
 * Data access for `fulfillment.delivery_zones`, acting as the signed-in admin; RLS requires
 * `fulfillment.manage`.
 * @param client The admin's RLS-scoped client.
 * @returns Delivery zone writes that return parsed zones or expected failures.
 */
export function deliveryZonesRepository(client: DatabaseClient) {
  return {
    insert: (input: DeliveryZoneInput, adminId: string) => insert(client, input, adminId),
    update: (id: string, input: DeliveryZoneInput, adminId: string) =>
      update(client, id, input, adminId),
    archive: (id: string, adminId: string) => archive(client, id, adminId),
  };
}

/**
 * Creates a delivery zone attributed to the admin.
 * @param client The admin's client.
 * @param input The validated zone.
 * @param adminId The admin creating it.
 * @returns The zone, or `zone_name_taken` when an active zone has the name.
 * @throws When the database fails unexpectedly.
 */
async function insert(
  client: DatabaseClient,
  input: DeliveryZoneInput,
  adminId: string,
): Promise<DeliveryZoneResult> {
  const response = await deliveryZones(client)
    .insert({ ...toRow(input), created_by: adminId, updated_by: adminId })
    .select(DELIVERY_ZONE_COLUMNS)
    .single();

  return FulfillmentResults.fromResponse(
    response,
    deliveryZoneRowSchema,
    FulfillmentError.DeliveryZoneNotFound,
  );
}

/**
 * Replaces an active delivery zone's fields. Orders already placed keep the fee they paid.
 * @param client The admin's client.
 * @param id The zone.
 * @param input The validated fields.
 * @param adminId The admin editing it.
 * @returns The zone, `delivery_zone_not_found` when it is missing or archived, or `zone_name_taken`.
 * @throws When the database fails unexpectedly.
 */
async function update(
  client: DatabaseClient,
  id: string,
  input: DeliveryZoneInput,
  adminId: string,
): Promise<DeliveryZoneResult> {
  const response = await deliveryZones(client)
    .update({ ...toRow(input), updated_by: adminId })
    .eq("id", id)
    .is("archived_at", null)
    .select(DELIVERY_ZONE_COLUMNS)
    .maybeSingle();

  return FulfillmentResults.fromResponse(
    response,
    deliveryZoneRowSchema,
    FulfillmentError.DeliveryZoneNotFound,
  );
}

/**
 * Archives an active delivery zone; checkout stops offering it and its name can be reused.
 * @param client The admin's client.
 * @param id The zone.
 * @param adminId The admin archiving it.
 * @returns The archived zone, or `delivery_zone_not_found`.
 * @throws When the database fails unexpectedly.
 */
async function archive(
  client: DatabaseClient,
  id: string,
  adminId: string,
): Promise<DeliveryZoneResult> {
  const response = await deliveryZones(client)
    .update({ archived_at: new Date().toISOString(), updated_by: adminId })
    .eq("id", id)
    .is("archived_at", null)
    .select(DELIVERY_ZONE_COLUMNS)
    .maybeSingle();

  return FulfillmentResults.fromResponse(
    response,
    deliveryZoneRowSchema,
    FulfillmentError.DeliveryZoneNotFound,
  );
}

function deliveryZones(client: DatabaseClient) {
  return client.schema("fulfillment").from("delivery_zones");
}

function toRow(
  input: DeliveryZoneInput,
): Database["fulfillment"]["Tables"]["delivery_zones"]["Insert"] {
  return {
    name: input.name,
    fee: input.fee,
    sort_order: input.sortOrder,
  };
}
