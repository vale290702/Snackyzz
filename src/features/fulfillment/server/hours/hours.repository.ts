import "server-only";

import type { DatabaseClient } from "@/integrations/supabase/database-client.types";
import { Results, type Result } from "@/shared/lib/result";

import { HOUR_COLUMNS, hourRowSchema } from "./hours.schema";
import type { DeliveryHours, PickupLocationHours } from "./hours.types";
import type { FulfillmentErrorCode } from "../../domain/errors";
import type { HourRange } from "../../domain/hours";
import { FulfillmentDatabaseError } from "../mutation";

/**
 * Replaces weekly hours through the `fulfillment.set_*_hours` entry points, acting as the
 * signed-in admin; they require `fulfillment.manage` and attribute the rows to the caller.
 * @param client The admin's RLS-scoped client.
 * @returns Hour replacements that return the hours now in effect.
 */
export function hoursRepository(client: DatabaseClient) {
  return {
    setPickupLocationHours: (pickupLocationId: string, hours: HourRange[]) =>
      setPickupLocationHours(client, pickupLocationId, hours),
    setDeliveryHours: (hours: HourRange[]) => setDeliveryHours(client, hours),
  };
}

/**
 * Replaces an active pickup location's weekly hours in one transaction.
 * @param client The admin's client.
 * @param pickupLocationId The location.
 * @param hours Validated, non-overlapping ranges; empty closes the location.
 * @returns The location's hours, or `pickup_location_not_found` when it is missing or archived.
 * @throws When the database fails unexpectedly.
 */
async function setPickupLocationHours(
  client: DatabaseClient,
  pickupLocationId: string,
  hours: HourRange[],
): Promise<Result<PickupLocationHours, FulfillmentErrorCode>> {
  const { error } = await client.schema("fulfillment").rpc("set_pickup_location_hours", {
    p_pickup_location_id: pickupLocationId,
    p_hours: toRows(hours),
  });
  if (error) {
    return FulfillmentDatabaseError.toFailure(error);
  }

  const { data, error: readError } = await client
    .schema("fulfillment")
    .from("pickup_location_hours")
    .select(HOUR_COLUMNS)
    .eq("pickup_location_id", pickupLocationId)
    .order("weekday")
    .order("opens_at");
  if (readError) {
    throw readError;
  }

  return Results.ok({ pickupLocationId, hours: data.map((row) => hourRowSchema.parse(row)) });
}

/**
 * Replaces the weekly delivery hours in one transaction.
 * @param client The admin's client.
 * @param hours Validated, non-overlapping ranges; empty closes delivery.
 * @returns The delivery hours.
 * @throws When the database fails unexpectedly.
 */
async function setDeliveryHours(
  client: DatabaseClient,
  hours: HourRange[],
): Promise<Result<DeliveryHours, FulfillmentErrorCode>> {
  const { error } = await client
    .schema("fulfillment")
    .rpc("set_delivery_hours", { p_hours: toRows(hours) });
  if (error) {
    return FulfillmentDatabaseError.toFailure(error);
  }

  const { data, error: readError } = await client
    .schema("fulfillment")
    .from("delivery_hours")
    .select(HOUR_COLUMNS)
    .order("weekday")
    .order("opens_at");
  if (readError) {
    throw readError;
  }

  return Results.ok({ hours: data.map((row) => hourRowSchema.parse(row)) });
}

function toRows(hours: HourRange[]) {
  return hours.map((range) => ({
    weekday: range.weekday,
    opens_at: range.opensAt,
    closes_at: range.closesAt,
  }));
}
