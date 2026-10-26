import { cacheTag } from "next/cache";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { createServiceClient } from "@/integrations/supabase/service-client";

import { getFulfillmentOptions, listPickupLocations } from "./options.query";
import { HourRanges } from "../../domain/hours";
import { FULFILLMENT_CACHE_TAG } from "../mutation";
import { FulfillmentFixtures } from "../testing/fulfillment-fixtures.helper";

vi.mock("next/cache", () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));

const fulfillment = () => createServiceClient().schema("fulfillment");
const fixture = {
  activeLocationId: "",
  archivedLocationId: "",
  activeZoneId: "",
  archivedZoneId: "",
};

async function insertLocation(archivedAt: string | null): Promise<string> {
  const { data, error } = await fulfillment()
    .from("pickup_locations")
    .insert({
      name: FulfillmentFixtures.uniqueName("options"),
      address: "Dirección de prueba",
      city: "Escazú",
      archived_at: archivedAt,
    })
    .select("id")
    .single();
  if (error) {
    throw error;
  }

  return data.id;
}

async function insertZone(archivedAt: string | null): Promise<string> {
  const { data, error } = await fulfillment()
    .from("delivery_zones")
    .insert({ name: FulfillmentFixtures.uniqueName("options"), fee: 1200, archived_at: archivedAt })
    .select("id")
    .single();
  if (error) {
    throw error;
  }

  return data.id;
}

beforeAll(async () => {
  const now = new Date().toISOString();
  fixture.activeLocationId = await insertLocation(null);
  fixture.archivedLocationId = await insertLocation(now);
  fixture.activeZoneId = await insertZone(null);
  fixture.archivedZoneId = await insertZone(now);

  const { error } = await fulfillment()
    .from("pickup_location_hours")
    .insert([
      {
        pickup_location_id: fixture.activeLocationId,
        weekday: 2,
        opens_at: "09:00",
        closes_at: "12:00",
      },
      {
        pickup_location_id: fixture.activeLocationId,
        weekday: 1,
        opens_at: "14:00",
        closes_at: "18:00",
      },
      {
        pickup_location_id: fixture.activeLocationId,
        weekday: 1,
        opens_at: "08:30",
        closes_at: "12:00",
      },
      {
        pickup_location_id: fixture.archivedLocationId,
        weekday: 1,
        opens_at: "09:00",
        closes_at: "12:00",
      },
    ]);
  if (error) {
    throw error;
  }
});

describe("getFulfillmentOptions", () => {
  it("lists active pickup locations with their hours in order, and active zones", async () => {
    const options = await getFulfillmentOptions();
    const location = options.pickupLocations.find((each) => each.id === fixture.activeLocationId);
    const zoneIds = options.deliveryZones.map((zone) => zone.id);

    expect(location?.hours).toEqual([
      { weekday: 1, opensAt: "08:30", closesAt: "12:00" },
      { weekday: 1, opensAt: "14:00", closesAt: "18:00" },
      { weekday: 2, opensAt: "09:00", closesAt: "12:00" },
    ]);
    expect(options.pickupLocations.map((each) => each.id)).not.toContain(
      fixture.archivedLocationId,
    );
    expect(zoneIds).toContain(fixture.activeZoneId);
    expect(zoneIds).not.toContain(fixture.archivedZoneId);
    expect(options.deliveryZones.find((zone) => zone.id === fixture.activeZoneId)?.fee).toBe(1200);
    expect(cacheTag).toHaveBeenCalledWith(FULFILLMENT_CACHE_TAG);
  });

  it("includes the settings and the delivery hours in order", async () => {
    const options = await getFulfillmentOptions();

    expect(options.settings.timezone).toBe("America/Costa_Rica");
    expect(options.deliveryHours).toEqual(HourRanges.sort(options.deliveryHours));
  });
});

describe("listPickupLocations", () => {
  it("lists the same active pickup locations for the Where to buy page", async () => {
    const locationIds = (await listPickupLocations()).map((location) => location.id);

    expect(locationIds).toContain(fixture.activeLocationId);
    expect(locationIds).not.toContain(fixture.archivedLocationId);
  });
});
