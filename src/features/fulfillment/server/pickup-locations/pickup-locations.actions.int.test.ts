import { updateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SharedError } from "@/shared/lib/result";

import {
  archivePickupLocationAction,
  createPickupLocationAction,
  updatePickupLocationAction,
} from "./pickup-locations.actions";
import { FulfillmentError } from "../../domain/errors";
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

function locationFields(label: string) {
  return {
    name: FulfillmentFixtures.uniqueName(label),
    address: "200 m al oeste del parque",
    city: "Escazú",
  };
}

beforeEach(() => {
  RequestCookies.clear();
  vi.mocked(updateTag).mockClear();
});

describe("pickup location actions without fulfillment.manage", () => {
  it("send visitors to sign-in", async () => {
    await expect(createPickupLocationAction(locationFields("visitor"))).rejects.toMatchObject(
      SIGN_IN_REDIRECT,
    );
  });

  it("refuse staff", async () => {
    await FulfillmentFixtures.signInAs(DemoAdmin.Staff.email);

    expect(await createPickupLocationAction(locationFields("staff"))).toEqual({
      ok: false,
      error: SharedError.Forbidden,
    });
    expect(updateTag).not.toHaveBeenCalled();
  });
});

describe("pickup location actions for owners", () => {
  beforeEach(async () => {
    await FulfillmentFixtures.signInAs(DemoAdmin.Owner.email);
  });

  it("create, edit and archive a pickup location", async () => {
    const fields = locationFields("location");

    const created = await createPickupLocationAction({
      ...fields,
      mapUrl: "https://maps.google.com/?q=Escazu",
      sortOrder: "3",
    });
    expect(created).toEqual({
      ok: true,
      value: expect.objectContaining({
        ...fields,
        mapUrl: "https://maps.google.com/?q=Escazu",
        instructions: null,
        sortOrder: 3,
        archivedAt: null,
      }),
    });
    if (!created.ok) {
      return;
    }

    const edited = await updatePickupLocationAction({
      ...fields,
      id: created.value.id,
      instructions: "Toca el timbre.",
    });
    expect(edited.ok && [edited.value.instructions, edited.value.mapUrl]).toEqual([
      "Toca el timbre.",
      null,
    ]);

    const archived = await archivePickupLocationAction({ id: created.value.id });
    expect(archived.ok && archived.value.archivedAt).toEqual(expect.any(String));
    expect(updateTag).toHaveBeenCalledTimes(3);
    expect(updateTag).toHaveBeenCalledWith(FULFILLMENT_CACHE_TAG);

    expect(await updatePickupLocationAction({ ...fields, id: created.value.id })).toEqual({
      ok: false,
      error: FulfillmentError.PickupLocationNotFound,
    });
    expect(await archivePickupLocationAction({ id: created.value.id })).toEqual({
      ok: false,
      error: FulfillmentError.PickupLocationNotFound,
    });
  });

  it("refuse malformed input without writing", async () => {
    for (const input of [null, "location", { ...locationFields("bad"), mapUrl: "http://maps" }]) {
      expect(await createPickupLocationAction(input)).toEqual({
        ok: false,
        error: SharedError.InvalidInput,
      });
    }
    expect(updateTag).not.toHaveBeenCalled();
  });
});
