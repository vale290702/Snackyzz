import { updateTag } from "next/cache";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createServiceClient } from "@/integrations/supabase/service-client";
import { SharedError } from "@/shared/lib/result";

import {
  archiveVariantAction,
  createVariantAction,
  setDefaultVariantAction,
  updateVariantAction,
} from "./variants.actions";
import { CatalogError } from "../../domain/errors";
import { createBrandAction } from "../brands";
import { archiveProductAction, createProductAction } from "../products";
import { CatalogFixtures, DemoAdmin } from "../testing/catalog-fixtures.helper";
import { RequestCookies } from "../testing/request-cookies.helper";

vi.mock("next/headers", async () => {
  const { RequestCookies: Cookies } = await import("../testing/request-cookies.helper");

  return Cookies.headersModule();
});
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("next/cache", () => ({ updateTag: vi.fn() }));

const fixture = { brandId: "" };

function value<Value>(result: { ok: true; value: Value } | { ok: false; error: string }): Value {
  if (!result.ok) {
    throw new Error(result.error);
  }

  return result.value;
}

async function createProduct(label: string): Promise<string> {
  const product = await createProductAction({
    brandId: fixture.brandId,
    slug: CatalogFixtures.uniqueSlug(label),
    name: "Galleta",
    description: "Una galleta para pruebas de presentaciones.",
    accentColor: "#3C1907",
  });

  return value(product).id;
}

async function priceHistory(variantId: string) {
  const { data, error } = await createServiceClient()
    .schema("catalog")
    .from("variant_price_history")
    .select("price, changed_by")
    .eq("variant_id", variantId)
    .order("changed_at");
  if (error) {
    throw error;
  }

  return data;
}

beforeAll(async () => {
  await CatalogFixtures.signInAs(DemoAdmin.Owner.email);
  const brand = await createBrandAction({
    slug: CatalogFixtures.uniqueSlug("variants"),
    name: "Marca",
  });
  fixture.brandId = value(brand).id;
});

beforeEach(async () => {
  RequestCookies.clear();
  vi.mocked(updateTag).mockClear();
  await CatalogFixtures.signInAs(DemoAdmin.Owner.email);
});

describe("variant actions", () => {
  it("refuse staff", async () => {
    RequestCookies.clear();
    await CatalogFixtures.signInAs(DemoAdmin.Staff.email);

    expect(await setDefaultVariantAction({ id: fixture.brandId })).toEqual({
      ok: false,
      error: SharedError.Forbidden,
    });
  });

  it("make a product's first variant its default, and only the first", async () => {
    const productId = await createProduct("defaults");
    vi.mocked(updateTag).mockClear();

    const first = value(await createVariantAction({ productId, name: "Unidad", price: 2500 }));
    const second = value(
      await createVariantAction({ productId, name: "Caja de 6", price: "14000" }),
    );

    expect(first).toEqual(expect.objectContaining({ isDefault: true, isStockTracked: true }));
    expect(second).toEqual(expect.objectContaining({ isDefault: false, price: 14000 }));
    expect(updateTag).toHaveBeenCalledTimes(2);
  });

  it("log price changes with the admin who made them", async () => {
    const productId = await createProduct("prices");
    const variant = value(await createVariantAction({ productId, name: "Unidad", price: 2500 }));
    const fields = { id: variant.id, name: variant.name, sku: null };

    await updateVariantAction({ ...fields, price: 2700 });
    await updateVariantAction({ ...fields, name: "Unidad grande", price: 2700 });

    expect(await priceHistory(variant.id)).toEqual([
      { price: 2500, changed_by: DemoAdmin.Owner.id },
      { price: 2700, changed_by: DemoAdmin.Owner.id },
    ]);
  });

  it("archive the default variant only after another becomes the default", async () => {
    const productId = await createProduct("swap");
    const first = value(await createVariantAction({ productId, name: "Unidad", price: 2500 }));
    const second = value(await createVariantAction({ productId, name: "Caja", price: 9000 }));

    expect(await archiveVariantAction({ id: first.id })).toEqual({
      ok: false,
      error: CatalogError.DefaultVariantRequired,
    });

    const swapped = await setDefaultVariantAction({ id: second.id });
    expect(swapped.ok && swapped.value.isDefault).toBe(true);

    const archived = await archiveVariantAction({ id: first.id });
    expect(archived.ok && archived.value).toEqual(
      expect.objectContaining({ isDefault: false, archivedAt: expect.any(String) }),
    );
    expect(await setDefaultVariantAction({ id: first.id })).toEqual({
      ok: false,
      error: CatalogError.VariantNotFound,
    });
  });

  it("report free variants, taken SKUs and archived products", async () => {
    const productId = await createProduct("refused");
    const sku = CatalogFixtures.uniqueSlug("sku").toUpperCase();
    await createVariantAction({ productId, sku, name: "Unidad", price: 2500 });

    expect(await createVariantAction({ productId, name: "Gratis", price: 0 })).toEqual({
      ok: false,
      error: SharedError.InvalidInput,
    });
    expect(await createVariantAction({ productId, sku, name: "Otra", price: 100 })).toEqual({
      ok: false,
      error: CatalogError.SkuTaken,
    });

    await archiveProductAction({ id: productId });
    expect(await createVariantAction({ productId, name: "Tarde", price: 100 })).toEqual({
      ok: false,
      error: CatalogError.ProductNotFound,
    });
  });
});
