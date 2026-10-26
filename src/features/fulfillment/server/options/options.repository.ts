import "server-only";

import type { DatabaseClient } from "@/integrations/supabase/database-client.types";

import {
  DELIVERY_ZONE_DTO_COLUMNS,
  PICKUP_LOCATION_DTO_COLUMNS,
  deliveryZoneDtoRowSchema,
  pickupLocationDtoRowSchema,
} from "./options.schema";
import type { DeliveryZoneDto, PickupLocationDto } from "./options.types";
import type { HourRange } from "../../domain/hours";
import { HOUR_COLUMNS, hourRowSchema } from "../hours/hours.schema";
import { SETTINGS_COLUMNS, settingsRowSchema } from "../settings/settings.schema";
import type { FulfillmentSettings } from "../settings/settings.types";

/**
 * Public fulfillment reads. With the anonymous client, RLS returns active rows only.
 * @param client A client acting as a shopper.
 * @returns Reads of settings, active pickup locations and zones, and delivery hours.
 */
export function optionsRepository(client: DatabaseClient) {
  return {
    getSettings: () => getSettings(client),
    listPickupLocations: () => listPickupLocations(client),
    listDeliveryZones: () => listDeliveryZones(client),
    listDeliveryHours: () => listDeliveryHours(client),
  };
}

/**
 * Reads the settings singleton.
 * @param client A shopper's client.
 * @returns The settings.
 * @throws When the database request fails or the singleton is missing.
 */
async function getSettings(client: DatabaseClient): Promise<FulfillmentSettings> {
  const { data, error } = await fulfillment(client)
    .from("settings")
    .select(SETTINGS_COLUMNS)
    .single();
  if (error) {
    throw error;
  }

  return settingsRowSchema.parse(data);
}

/**
 * Lists active pickup locations with their hours, in display order.
 * @param client A shopper's client.
 * @returns The locations.
 * @throws When the database request fails.
 */
async function listPickupLocations(client: DatabaseClient): Promise<PickupLocationDto[]> {
  const { data, error } = await fulfillment(client)
    .from("pickup_locations")
    .select(PICKUP_LOCATION_DTO_COLUMNS)
    .order("sort_order")
    .order("name");
  if (error) {
    throw error;
  }

  return data.map((row) => pickupLocationDtoRowSchema.parse(row));
}

/**
 * Lists active delivery zones in display order.
 * @param client A shopper's client.
 * @returns The zones.
 * @throws When the database request fails.
 */
async function listDeliveryZones(client: DatabaseClient): Promise<DeliveryZoneDto[]> {
  const { data, error } = await fulfillment(client)
    .from("delivery_zones")
    .select(DELIVERY_ZONE_DTO_COLUMNS)
    .order("sort_order")
    .order("name");
  if (error) {
    throw error;
  }

  return data.map((row) => deliveryZoneDtoRowSchema.parse(row));
}

/**
 * Lists the weekly delivery hours by weekday and opening time.
 * @param client A shopper's client.
 * @returns The hours; empty when delivery has none.
 * @throws When the database request fails.
 */
async function listDeliveryHours(client: DatabaseClient): Promise<HourRange[]> {
  const { data, error } = await fulfillment(client)
    .from("delivery_hours")
    .select(HOUR_COLUMNS)
    .order("weekday")
    .order("opens_at");
  if (error) {
    throw error;
  }

  return data.map((row) => hourRowSchema.parse(row));
}

function fulfillment(client: DatabaseClient) {
  return client.schema("fulfillment");
}
