import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { createAnonClient } from "@/integrations/supabase/anon-client";

import { optionsRepository } from "./options.repository";
import type { FulfillmentOptions, PickupLocationDto } from "./options.types";
import { FULFILLMENT_CACHE_TAG } from "../mutation";

/**
 * Loads what checkout offers for pickup and delivery, cached until an admin changes fulfillment.
 * Delivery windows depend on the current time, so they are never cached: compute them from
 * `deliveryHours` and `settings` with the delivery-window rules.
 * @returns Settings, active pickup locations with hours, active zones and delivery hours.
 * @throws When the database request fails.
 */
export async function getFulfillmentOptions(): Promise<FulfillmentOptions> {
  "use cache";
  cacheTag(FULFILLMENT_CACHE_TAG);
  cacheLife("max");

  const repository = optionsRepository(createAnonClient());
  const [settings, pickupLocations, deliveryZones, deliveryHours] = await Promise.all([
    repository.getSettings(),
    repository.listPickupLocations(),
    repository.listDeliveryZones(),
    repository.listDeliveryHours(),
  ]);

  return { settings, pickupLocations, deliveryZones, deliveryHours };
}

/**
 * Lists active pickup locations with their hours for the "Where to buy" page, cached until an
 * admin changes fulfillment.
 * @returns The locations in display order.
 * @throws When the database request fails.
 */
export async function listPickupLocations(): Promise<PickupLocationDto[]> {
  "use cache";
  cacheTag(FULFILLMENT_CACHE_TAG);
  cacheLife("max");

  return optionsRepository(createAnonClient()).listPickupLocations();
}
