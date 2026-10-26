import { updateTag } from "next/cache";
import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { SharedError } from "@/shared/lib/result";

import {
  archiveProductAction,
  createProductAction,
  saveProductAction,
  updateProductAction,
} from "./products.actions";
import { CatalogError } from "../../domain/errors";
import { createBrandAction } from "../brands";
import { archiveCategoryAction, createCategoryAction } from "../categories";
import { CatalogFixtures, DemoAdmin } from "../testing/catalog-fixtures.helper";
import { RequestCookies } from "../testing/request-cookies.helper";
import { createVariantAction } from "../variants";

vi.mock("next/headers", async () => {
  const { RequestCookies: Cookies } = await import("../testing/request-cookies.helper");

  return Cookies.headersModule();
});
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("next/cache", () => ({ updateTag: vi.fn() }));

const fixture = { brandId: "", categoryIds: [] as string[], archivedCategoryId: "" };

function productFields(label: string) {
  return {
    brandId: fixture.brandId,
    slug: CatalogFixtures.uniqueSlug(label),
    name: "Galleta de prueba",
    description: "Una galleta para pruebas de integración.",
    accentColor: "#ED781A",
  };
}

async function createdId(
  result: { ok: true; value: { id: string } } | { ok: false; error: string },
) {
  if (!result.ok) {
    throw new Error(result.error);
  }

  return result.value.id;
}

beforeAll(async () => {
  await CatalogFixtures.signInAs(DemoAdmin.Owner.email);

  const brandSlug = CatalogFixtures.uniqueSlug("product-brand");
  fixture.brandId = await createdId(await createBrandAction({ slug: brandSlug, name: "Marca" }));

  for (const label of ["first", "second", "archived"]) {
    const slug = CatalogFixtures.uniqueSlug(label);
    fixture.categoryIds.push(await createdId(await createCategoryAction({ slug, name: label })));
  }

  fixture.archivedCategoryId = fixture.categoryIds.pop() ?? "";
  await archiveCategoryAction({ id: fixture.archivedCategoryId });
  RequestCookies.clear();
});

beforeEach(() => {
  RequestCookies.clear();
  vi.mocked(updateTag).mockClear();
});

describe("product actions without catalog.manage", () => {
  it("refuse staff", async () => {
    await CatalogFixtures.signInAs(DemoAdmin.Staff.email);

    expect(await createProductAction(productFields("staff"))).toEqual({
      ok: false,
      error: SharedError.Forbidden,
    });
  });
});

describe("product actions for owners", () => {
  beforeEach(async () => {
    await CatalogFixtures.signInAs(DemoAdmin.Owner.email);
  });

  it("create a product with its image and categories", async () => {
    const imageId = await CatalogFixtures.registerFile("product_image");
    const fields = {
      ...productFields("create"),
      imageFileId: imageId,
      categoryIds: fixture.categoryIds,
    };

    const result = await createProductAction(fields);

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        slug: fields.slug,
        badge: null,
        imageFileId: imageId,
        categoryIds: expect.arrayContaining(fixture.categoryIds),
      }),
    });
    expect(updateTag).toHaveBeenCalledOnce();
  });

  it("replace a product's categories on update", async () => {
    const fields = { ...productFields("update"), categoryIds: fixture.categoryIds };
    const id = await createdId(await createProductAction(fields));
    const [keptCategoryId] = fixture.categoryIds;

    const updated = await updateProductAction({
      ...fields,
      id,
      badge: "Nuevo",
      categoryIds: [keptCategoryId],
    });

    expect(updated.ok && updated.value.categoryIds).toEqual([keptCategoryId]);
    expect(updated.ok && updated.value.badge).toBe("Nuevo");
  });

  it("refuse brand logos as product images", async () => {
    const logoId = await CatalogFixtures.registerFile("brand_logo");

    expect(await createProductAction({ ...productFields("logo"), imageFileId: logoId })).toEqual({
      ok: false,
      error: CatalogError.InvalidImage,
    });
  });

  it("report unknown brands, archived categories and taken slugs without writing", async () => {
    const fields = productFields("refused");

    expect(await createProductAction({ ...fields, brandId: randomUUID() })).toEqual({
      ok: false,
      error: CatalogError.BrandNotFound,
    });
    expect(
      await createProductAction({ ...fields, categoryIds: [fixture.archivedCategoryId] }),
    ).toEqual({ ok: false, error: CatalogError.CategoryNotFound });

    await createProductAction(fields);
    expect(await createProductAction(fields)).toEqual({ ok: false, error: CatalogError.SlugTaken });
  });

  it("archive a product once", async () => {
    const id = await createdId(await createProductAction(productFields("archive")));

    const archived = await archiveProductAction({ id });

    expect(archived.ok && archived.value.archivedAt).toEqual(expect.any(String));
    expect(await archiveProductAction({ id })).toEqual({
      ok: false,
      error: CatalogError.ProductNotFound,
    });
  });
});

describe("saving the product editor", () => {
  beforeEach(async () => {
    await CatalogFixtures.signInAs(DemoAdmin.Owner.email);
  });

  it("creates a product with its first presentation as the default", async () => {
    const saved = await saveProductAction({
      ...productFields("save-create"),
      presentation: { name: "Unidad", price: 2500, isStockTracked: false },
    });

    expect(saved).toMatchObject({ ok: true, value: { presentationError: null } });
    if (!saved.ok) return;
    const productId = saved.value.product.id;
    expect(await createVariantAction({ productId, name: "Caja", price: 9000 })).toMatchObject({
      ok: true,
      value: { isDefault: false },
    });
    expect(updateTag).toHaveBeenCalled();
  });

  it("returns the saved product when its presentation fails, and the retry updates it", async () => {
    const sku = CatalogFixtures.uniqueSlug("sku");
    const other = await createdId(await createProductAction(productFields("save-sku-owner")));
    await createVariantAction({ productId: other, name: "Unidad", price: 1000, sku });
    const fields = productFields("save-retry");

    const failed = await saveProductAction({
      ...fields,
      presentation: { name: "Unidad", price: 2500, sku },
    });

    expect(failed).toMatchObject({ ok: true, value: { presentationError: CatalogError.SkuTaken } });
    if (!failed.ok) return;
    const retried = await saveProductAction({
      ...fields,
      id: failed.value.product.id,
      presentation: { name: "Unidad", price: 2500 },
    });
    expect(retried).toMatchObject({
      ok: true,
      value: { product: { id: failed.value.product.id }, presentationError: null },
    });
  });

  it("writes nothing when the presentation is invalid", async () => {
    const fields = productFields("save-invalid");

    expect(
      await saveProductAction({ ...fields, presentation: { name: "Unidad", price: 0 } }),
    ).toEqual({ ok: false, error: SharedError.InvalidInput });
    expect(await createProductAction(fields)).toMatchObject({ ok: true });
  });
});
