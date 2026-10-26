import { updateTag } from "next/cache";
import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createProductAction, createVariantAction, archiveProductAction } from "@/features/catalog";
import { createPickupLocationAction } from "@/features/fulfillment";
import { createServerClient } from "@/integrations/supabase/server-client";
import { SharedError } from "@/shared/lib/result";

import { adjustStockAction } from "./stock.actions";
import { listMovements, listStockLevels } from "./stock.query";
import { InventoryError } from "../../domain/errors";
import { getAvailability } from "../availability/availability.query";
import { INVENTORY_CACHE_TAG } from "../mutation";
import { RequestCookies } from "../testing/request-cookies.helper";

vi.mock("next/headers", async () => {
  const { RequestCookies: Cookies } = await import("../testing/request-cookies.helper");

  return Cookies.headersModule();
});
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("next/cache", () => ({ updateTag: vi.fn(), cacheTag: vi.fn(), cacheLife: vi.fn() }));

const OWNER = "owner@snackyzz.test";
const STAFF = "staff@snackyzz.test";
const PRIMARY_BRAND_ID = "00000000-0000-7000-8000-0000000000b1";

async function signIn(email = OWNER) {
  const client = await createServerClient();
  const { error } = await client.auth.signInWithPassword({ email, password: "snackyzz-demo" });
  if (error) {
    throw error;
  }
}

async function variant(isStockTracked = true) {
  const product = await createProductAction({
    brandId: PRIMARY_BRAND_ID,
    slug: `inventory-${randomUUID()}`,
    name: "Inventory test",
    description: "Inventory test",
    accentColor: "#123456",
  });
  expect(product.ok).toBe(true);
  if (!product.ok) {
    throw new Error("Product fixture failed");
  }

  const created = await createVariantAction({
    productId: product.value.id,
    name: "Unidad",
    price: 100,
    isStockTracked,
  });
  expect(created.ok).toBe(true);
  if (!created.ok) {
    throw new Error("Variant fixture failed");
  }

  return { variantId: created.value.id, productId: product.value.id };
}

beforeEach(() => {
  RequestCookies.clear();
  vi.mocked(updateTag).mockClear();
});

describe("inventory authorization", () => {
  it("redirects visitors and rejects malformed input after sign-in", async () => {
    await expect(adjustStockAction({})).rejects.toMatchObject({
      digest: expect.stringContaining("/admin/sign-in"),
    });
    await signIn();

    for (const input of [null, {}, { variantId: randomUUID(), quantity: -1 }]) {
      expect(await adjustStockAction(input)).toEqual({
        ok: false,
        error: SharedError.InvalidInput,
      });
    }
    expect(updateTag).not.toHaveBeenCalled();
  });
});

describe("inventory adjustments", () => {
  beforeEach(async () => {
    await signIn();
  });

  it("sets quantities, attributes immutable deltas, skips no-ops and expires availability", async () => {
    const { variantId } = await variant();
    vi.mocked(updateTag).mockClear();

    const initial = await adjustStockAction({ variantId, quantity: 8, note: "Initial count" });
    expect(initial).toEqual({
      ok: true,
      value: expect.objectContaining({ variantId, quantityAvailable: 8, scope: "global" }),
    });
    if (!initial.ok) {
      return;
    }

    expect(await adjustStockAction({ variantId, quantity: 3, note: "Recount" })).toMatchObject({
      ok: true,
      value: { quantityAvailable: 3 },
    });
    expect(await adjustStockAction({ variantId, quantity: 3 })).toMatchObject({ ok: true });
    const ledger = await listMovements(initial.value.id);
    expect(ledger.ok && ledger.value.map((movement) => movement.quantityDelta)).toEqual([-5, 8]);
    expect(
      ledger.ok &&
        ledger.value.every(
          (movement) => movement.createdBy === "00000000-0000-7000-8000-000000000001",
        ),
    ).toBe(true);
    expect(updateTag).toHaveBeenCalledWith(INVENTORY_CACHE_TAG);
    const levels = await listStockLevels();
    expect(levels.ok && levels.value.some((level) => level.id === initial.value.id)).toBe(true);
  });

  it("allows staff to manage inventory", async () => {
    const { variantId } = await variant();
    await signIn(STAFF);

    const result = await adjustStockAction({ variantId, quantity: 2 });
    expect(result).toMatchObject({ ok: true, value: { quantityAvailable: 2 } });
    if (!result.ok) {
      return;
    }
    const ledger = await listMovements(result.value.id);
    expect(ledger.ok && ledger.value[0]?.createdBy).toBe("00000000-0000-7000-8000-000000000002");
  });

  it("serializes concurrent initial adjustments and leaves one pool and one movement", async () => {
    const { variantId } = await variant();
    const results = await Promise.all(
      Array.from({ length: 6 }, () => adjustStockAction({ variantId, quantity: 7 })),
    );
    expect(results.every((result) => result.ok)).toBe(true);
    const first = results[0];
    if (!first?.ok) {
      return;
    }

    expect(new Set(results.flatMap((result) => (result.ok ? [result.value.id] : []))).size).toBe(1);
    const ledger = await listMovements(first.value.id);
    expect(ledger.ok && ledger.value.map((movement) => movement.quantityDelta)).toEqual([7]);
  });

  it("refuses missing, untracked and invalid-location adjustments without invalidating", async () => {
    const untracked = await variant(false);
    const tracked = await variant();
    vi.mocked(updateTag).mockClear();

    expect(await adjustStockAction({ variantId: untracked.variantId, quantity: 1 })).toEqual({
      ok: false,
      error: InventoryError.VariantNotStockTracked,
    });
    expect(await adjustStockAction({ variantId: randomUUID(), quantity: 1 })).toEqual({
      ok: false,
      error: InventoryError.VariantNotStockTracked,
    });
    expect(
      await adjustStockAction({
        variantId: tracked.variantId,
        quantity: 1,
        pickupLocationId: randomUUID(),
      }),
    ).toEqual({ ok: false, error: InventoryError.PickupLocationNotFound });
    expect(updateTag).not.toHaveBeenCalled();
  });

  it("keeps location pools independent and returns boolean-only public availability", async () => {
    const tracked = await variant();
    const untracked = await variant(false);
    const missing = await variant();
    const location = await createPickupLocationAction({
      name: "Inventory pickup",
      address: "Test address",
      city: "Escazú",
    });
    expect(location.ok).toBe(true);
    if (!location.ok) {
      return;
    }
    await adjustStockAction({ variantId: tracked.variantId, quantity: 5 });
    await adjustStockAction({
      variantId: tracked.variantId,
      quantity: 0,
      pickupLocationId: location.value.id,
    });

    RequestCookies.clear();
    const ids = [tracked.variantId, untracked.variantId, missing.variantId];
    expect(await getAvailability(ids)).toEqual(
      expect.arrayContaining([
        { variantId: tracked.variantId, isAvailable: true },
        { variantId: untracked.variantId, isAvailable: true },
        { variantId: missing.variantId, isAvailable: false },
      ]),
    );
    expect(await getAvailability([tracked.variantId], location.value.id)).toEqual([
      { variantId: tracked.variantId, isAvailable: false },
    ]);
    expect(await getAvailability([tracked.variantId], randomUUID())).toEqual([
      { variantId: tracked.variantId, isAvailable: true },
    ]);
    expect(await getAvailability([])).toEqual([]);

    await signIn();
    await archiveProductAction({ id: tracked.productId });
    expect(await getAvailability([tracked.variantId])).toEqual([]);
  });
});
