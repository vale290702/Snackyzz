import { updateTag } from "next/cache";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createServiceClient } from "@/integrations/supabase/service-client";
import { SharedError } from "@/shared/lib/result";

import { setDeliveryHoursAction, setPickupLocationHoursAction } from "./hours.actions";
import { HOUR_COLUMNS, hourRowSchema } from "./hours.schema";
import { FulfillmentError } from "../../domain/errors";
import type { HourRange } from "../../domain/hours";
import { FULFILLMENT_CACHE_TAG } from "../mutation";
import {
  DemoAdmin,
  FulfillmentFixtures,
  SIGN_IN_REDIRECT,
} from "../testing/fulfillment-fixtures.helper";
import { RequestCookies } from "../testing/request-cookies.helper";

vi.mock("next/headers", async () => {
  const { RequestCookies: Cookies } = await import("../testing/request-cookies.helper");

  return Cookies.headersModule();
});
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("next/cache", () => ({ updateTag: vi.fn() }));

const service = createServiceClient();
const fixture = { activeLocationId: "", archivedLocationId: "", deliveryHours: [] as HourRange[] };

async function insertLocation(archivedAt: string | null): Promise<string> {
  const { data, error } = await service
    .schema("fulfillment")
    .from("pickup_locations")
    .insert({
      name: FulfillmentFixtures.uniqueName("hours"),
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

beforeAll(async () => {
  fixture.activeLocationId = await insertLocation(null);
  fixture.archivedLocationId = await insertLocation(new Date().toISOString());

  const { data, error } = await service
    .schema("fulfillment")
    .from("delivery_hours")
    .select(HOUR_COLUMNS);
  if (error) {
    throw error;
  }
  fixture.deliveryHours = data.map((row) => hourRowSchema.parse(row));
});

afterAll(async () => {
  RequestCookies.clear();
  await FulfillmentFixtures.signInAs(DemoAdmin.Owner.email);
  await setDeliveryHoursAction({ hours: fixture.deliveryHours });
});

beforeEach(() => {
  RequestCookies.clear();
  vi.mocked(updateTag).mockClear();
});

describe("hour actions without fulfillment.manage", () => {
  it("send visitors to sign-in", async () => {
    await expect(setDeliveryHoursAction({ hours: [] })).rejects.toMatchObject(SIGN_IN_REDIRECT);
  });

  it("refuse staff", async () => {
    await FulfillmentFixtures.signInAs(DemoAdmin.Staff.email);
    const input = { pickupLocationId: fixture.activeLocationId, hours: [] };

    expect(await setPickupLocationHoursAction(input)).toEqual({
      ok: false,
      error: SharedError.Forbidden,
    });
  });
});

describe("hour actions for owners", () => {
  beforeEach(async () => {
    await FulfillmentFixtures.signInAs(DemoAdmin.Owner.email);
  });

  it("replace a pickup location's hours and return them in order", async () => {
    const first = await setPickupLocationHoursAction({
      pickupLocationId: fixture.activeLocationId,
      hours: [
        { weekday: 2, opensAt: "14:00", closesAt: "18:00" },
        { weekday: 1, opensAt: "09:00", closesAt: "12:00" },
        { weekday: 2, opensAt: "09:00", closesAt: "12:00" },
      ],
    });
    expect(first).toEqual({
      ok: true,
      value: {
        pickupLocationId: fixture.activeLocationId,
        hours: [
          { weekday: 1, opensAt: "09:00", closesAt: "12:00" },
          { weekday: 2, opensAt: "09:00", closesAt: "12:00" },
          { weekday: 2, opensAt: "14:00", closesAt: "18:00" },
        ],
      },
    });

    const replaced = await setPickupLocationHoursAction({
      pickupLocationId: fixture.activeLocationId,
      hours: [{ weekday: 6, opensAt: "10:00", closesAt: "13:30" }],
    });
    expect(replaced.ok && replaced.value.hours).toEqual([
      { weekday: 6, opensAt: "10:00", closesAt: "13:30" },
    ]);
    expect(updateTag).toHaveBeenCalledWith(FULFILLMENT_CACHE_TAG);
  });

  it("reject overlapping or inverted ranges and keep the current hours", async () => {
    const overlapping = [
      { weekday: 3, opensAt: "09:00", closesAt: "13:00" },
      { weekday: 3, opensAt: "12:00", closesAt: "15:00" },
    ];
    const inverted = [{ weekday: 3, opensAt: "18:00", closesAt: "09:00" }];

    for (const hours of [overlapping, inverted]) {
      expect(
        await setPickupLocationHoursAction({ pickupLocationId: fixture.activeLocationId, hours }),
      ).toEqual({
        ok: false,
        error: SharedError.InvalidInput,
      });
      expect(await setDeliveryHoursAction({ hours })).toEqual({
        ok: false,
        error: SharedError.InvalidInput,
      });
    }
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("refuse hours for an archived or unknown pickup location", async () => {
    const unknownId = "00000000-0000-7000-8000-0000000000ff";

    for (const pickupLocationId of [fixture.archivedLocationId, unknownId]) {
      expect(await setPickupLocationHoursAction({ pickupLocationId, hours: [] })).toEqual({
        ok: false,
        error: FulfillmentError.PickupLocationNotFound,
      });
    }
  });

  it("replace the delivery hours, closing delivery with an empty schedule", async () => {
    const replaced = await setDeliveryHoursAction({
      hours: [{ weekday: 7, opensAt: "10:00", closesAt: "12:00" }],
    });
    expect(replaced).toEqual({
      ok: true,
      value: { hours: [{ weekday: 7, opensAt: "10:00", closesAt: "12:00" }] },
    });

    expect(await setDeliveryHoursAction({ hours: [] })).toEqual({ ok: true, value: { hours: [] } });
  });
});
