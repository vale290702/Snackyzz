import { updateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SharedError } from "@/shared/lib/result";

import {
  archiveDeliveryZoneAction,
  createDeliveryZoneAction,
  updateDeliveryZoneAction,
} from "./delivery-zones.actions";
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

beforeEach(() => {
  RequestCookies.clear();
  vi.mocked(updateTag).mockClear();
});

describe("delivery zone actions without fulfillment.manage", () => {
  it("send visitors to sign-in", async () => {
    const fields = { name: FulfillmentFixtures.uniqueName("visitor"), fee: 1000 };

    await expect(createDeliveryZoneAction(fields)).rejects.toMatchObject(SIGN_IN_REDIRECT);
  });

  it("refuse staff", async () => {
    await FulfillmentFixtures.signInAs(DemoAdmin.Staff.email);
    const fields = { name: FulfillmentFixtures.uniqueName("staff"), fee: 1000 };

    expect(await createDeliveryZoneAction(fields)).toEqual({
      ok: false,
      error: SharedError.Forbidden,
    });
  });
});

describe("delivery zone actions for owners", () => {
  beforeEach(async () => {
    await FulfillmentFixtures.signInAs(DemoAdmin.Owner.email);
  });

  it("create, reprice and archive a zone", async () => {
    const name = FulfillmentFixtures.uniqueName("zone");

    const created = await createDeliveryZoneAction({ name, fee: "1500" });
    expect(created).toEqual({
      ok: true,
      value: expect.objectContaining({ name, fee: 1500, sortOrder: 0, archivedAt: null }),
    });
    if (!created.ok) {
      return;
    }

    const repriced = await updateDeliveryZoneAction({ id: created.value.id, name, fee: 0 });
    expect(repriced.ok && repriced.value.fee).toBe(0);

    const archived = await archiveDeliveryZoneAction({ id: created.value.id });
    expect(archived.ok && archived.value.archivedAt).toEqual(expect.any(String));
    expect(updateTag).toHaveBeenCalledTimes(3);
    expect(updateTag).toHaveBeenCalledWith(FULFILLMENT_CACHE_TAG);

    expect(await updateDeliveryZoneAction({ id: created.value.id, name, fee: 1 })).toEqual({
      ok: false,
      error: FulfillmentError.DeliveryZoneNotFound,
    });
  });

  it("report a name another active zone has, ignoring case, and free it on archive", async () => {
    const name = FulfillmentFixtures.uniqueName("taken");
    const first = await createDeliveryZoneAction({ name, fee: 1000 });

    expect(await createDeliveryZoneAction({ name: name.toUpperCase(), fee: 2000 })).toEqual({
      ok: false,
      error: FulfillmentError.ZoneNameTaken,
    });

    if (!first.ok) {
      throw new Error("the first zone was not created");
    }
    await archiveDeliveryZoneAction({ id: first.value.id });

    const reused = await createDeliveryZoneAction({ name, fee: 2000 });
    expect(reused.ok && reused.value.name).toBe(name);
  });

  it("refuse negative fees as invalid input", async () => {
    const fields = { name: FulfillmentFixtures.uniqueName("negative"), fee: -1 };

    expect(await createDeliveryZoneAction(fields)).toEqual({
      ok: false,
      error: SharedError.InvalidInput,
    });
  });
});
