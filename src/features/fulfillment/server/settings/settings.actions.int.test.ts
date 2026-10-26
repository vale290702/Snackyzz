import { updateTag } from "next/cache";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createServiceClient } from "@/integrations/supabase/service-client";
import { SharedError } from "@/shared/lib/result";

import { updateFulfillmentSettingsAction } from "./settings.actions";
import { SETTINGS_COLUMNS, settingsRowSchema } from "./settings.schema";
import type { FulfillmentSettings } from "./settings.types";
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

const fixture: { original: FulfillmentSettings | null } = { original: null };

beforeAll(async () => {
  const { data, error } = await createServiceClient()
    .schema("fulfillment")
    .from("settings")
    .select(SETTINGS_COLUMNS)
    .single();
  if (error) {
    throw error;
  }
  fixture.original = settingsRowSchema.parse(data);
});

afterAll(async () => {
  if (fixture.original === null) {
    return;
  }

  RequestCookies.clear();
  await FulfillmentFixtures.signInAs(DemoAdmin.Owner.email);
  await updateFulfillmentSettingsAction({
    isPickupEnabled: fixture.original.isPickupEnabled,
    isDeliveryEnabled: fixture.original.isDeliveryEnabled,
    deliveryLeadHours: fixture.original.deliveryLeadHours,
    deliverySlotHours: fixture.original.deliverySlotHours,
  });
});

beforeEach(() => {
  RequestCookies.clear();
  vi.mocked(updateTag).mockClear();
});

const NEW_SETTINGS = {
  isPickupEnabled: false,
  isDeliveryEnabled: true,
  deliveryLeadHours: "24",
  deliverySlotHours: 2,
};

describe("updateFulfillmentSettingsAction", () => {
  it("sends visitors to sign-in", async () => {
    await expect(updateFulfillmentSettingsAction(NEW_SETTINGS)).rejects.toMatchObject(
      SIGN_IN_REDIRECT,
    );
  });

  it("refuses staff", async () => {
    await FulfillmentFixtures.signInAs(DemoAdmin.Staff.email);

    expect(await updateFulfillmentSettingsAction(NEW_SETTINGS)).toEqual({
      ok: false,
      error: SharedError.Forbidden,
    });
  });

  it("lets owners change the settings, but not the time zone", async () => {
    await FulfillmentFixtures.signInAs(DemoAdmin.Owner.email);

    const updated = await updateFulfillmentSettingsAction({ ...NEW_SETTINGS, timezone: "UTC" });

    expect(updated).toEqual({
      ok: true,
      value: {
        isPickupEnabled: false,
        isDeliveryEnabled: true,
        deliveryLeadHours: 24,
        deliverySlotHours: 2,
        timezone: "America/Costa_Rica",
      },
    });
    expect(updateTag).toHaveBeenCalledWith(FULFILLMENT_CACHE_TAG);
  });

  it("refuses window lengths outside 1 to 12 hours", async () => {
    await FulfillmentFixtures.signInAs(DemoAdmin.Owner.email);

    expect(
      await updateFulfillmentSettingsAction({ ...NEW_SETTINGS, deliverySlotHours: 13 }),
    ).toEqual({
      ok: false,
      error: SharedError.InvalidInput,
    });
  });
});
