import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { createAnonClient } from "@/integrations/supabase/anon-client";

import { availabilityRepository } from "./availability.repository";
import { availabilityInputSchema } from "../../domain/stock";
import { CATALOG_CACHE_TAG, INVENTORY_CACHE_TAG } from "../mutation/mutation.constants";

/**
 * Reads cached public availability; stock and catalog changes expire the cache.
 * Checkout must reserve atomically in SQL rather than trust this display hint.
 * @param variantIds Variant references, up to the API response limit.
 * @param pickupLocationId Pickup scope; omitted for delivery/global stock.
 * @returns Boolean availability for visible variants only.
 * @throws When arguments or the database response are invalid.
 */
export async function getAvailability(variantIds: string[], pickupLocationId?: string) {
  "use cache";
  cacheTag(INVENTORY_CACHE_TAG, CATALOG_CACHE_TAG);
  cacheLife("seconds");

  const input = availabilityInputSchema.parse({ variantIds, pickupLocationId });

  return availabilityRepository(createAnonClient()).get(input.variantIds, input.pickupLocationId);
}
