import { updateTag } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SharedError } from "@/shared/lib/result";

import {
  archiveBrandAction,
  createBrandAction,
  setPrimaryBrandAction,
  updateBrandAction,
} from "./brands.actions";
import { CatalogError } from "../../domain/errors";
import { CATALOG_CACHE_TAG } from "../mutation";
import {
  CatalogFixtures,
  DemoAdmin,
  SEED_PRIMARY_BRAND_ID,
  SIGN_IN_REDIRECT,
} from "../testing/catalog-fixtures.helper";
import { RequestCookies } from "../testing/request-cookies.helper";

vi.mock("next/headers", async () => {
  const { RequestCookies: Cookies } = await import("../testing/request-cookies.helper");

  return Cookies.headersModule();
});
vi.mock("next/server", () => ({ connection: async () => undefined }));
vi.mock("next/cache", () => ({ updateTag: vi.fn() }));

function brandFields(label: string) {
  return { slug: CatalogFixtures.uniqueSlug(label), name: "Marca de prueba" };
}

beforeEach(() => {
  RequestCookies.clear();
  vi.mocked(updateTag).mockClear();
});

describe("brand actions without catalog.manage", () => {
  it("send visitors to sign-in", async () => {
    await expect(createBrandAction(brandFields("visitor"))).rejects.toMatchObject(SIGN_IN_REDIRECT);
  });

  it("refuse staff before reading the input", async () => {
    await CatalogFixtures.signInAs(DemoAdmin.Staff.email);

    expect(await createBrandAction({ slug: "Not valid" })).toEqual({
      ok: false,
      error: SharedError.Forbidden,
    });
    expect(updateTag).not.toHaveBeenCalled();
  });
});

describe("brand actions for owners", () => {
  beforeEach(async () => {
    await CatalogFixtures.signInAs(DemoAdmin.Owner.email);
  });

  it("create a collab brand attributed to the owner and expire the storefront cache", async () => {
    const fields = { ...brandFields("create"), tagline: "  ", label: "Colab · Prueba" };

    const result = await createBrandAction(fields);

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        slug: fields.slug,
        tagline: null,
        label: "Colab · Prueba",
        isPrimary: false,
        archivedAt: null,
      }),
    });
    expect(updateTag).toHaveBeenCalledWith(CATALOG_CACHE_TAG);
  });

  it("report invalid input and taken slugs", async () => {
    const fields = brandFields("taken");
    await createBrandAction(fields);

    expect(await createBrandAction({ ...fields, slug: "Not Valid" })).toEqual({
      ok: false,
      error: SharedError.InvalidInput,
    });
    expect(await createBrandAction(fields)).toEqual({ ok: false, error: CatalogError.SlugTaken });
  });

  it("attach brand logos but refuse product images and proofs", async () => {
    const created = await createBrandAction(brandFields("logo"));
    if (!created.ok) {
      throw new Error(created.error);
    }

    const logoId = await CatalogFixtures.registerFile("brand_logo");
    const productImageId = await CatalogFixtures.registerFile("product_image");
    const proofId = await CatalogFixtures.registerFile("payment_proof");
    const { id, slug, name } = created.value;

    const attached = await updateBrandAction({ id, slug, name, logoFileId: logoId });
    expect(attached.ok && attached.value.logoFileId).toBe(logoId);

    for (const fileId of [productImageId, proofId]) {
      expect(await updateBrandAction({ id, slug, name, logoFileId: fileId })).toEqual({
        ok: false,
        error: CatalogError.InvalidImage,
      });
    }
  });

  it("report brand_not_found for unknown and archived brands", async () => {
    const created = await createBrandAction(brandFields("archive"));
    if (!created.ok) {
      throw new Error(created.error);
    }
    const { id, slug, name } = created.value;

    const archived = await archiveBrandAction({ id });
    expect(archived.ok && archived.value.archivedAt).toEqual(expect.any(String));

    expect(await archiveBrandAction({ id })).toEqual({
      ok: false,
      error: CatalogError.BrandNotFound,
    });
    expect(await updateBrandAction({ id, slug, name })).toEqual({
      ok: false,
      error: CatalogError.BrandNotFound,
    });
    expect(await setPrimaryBrandAction({ id })).toEqual({
      ok: false,
      error: CatalogError.BrandNotFound,
    });
  });

  it("refuse to archive the primary brand", async () => {
    expect(await archiveBrandAction({ id: SEED_PRIMARY_BRAND_ID })).toEqual({
      ok: false,
      error: CatalogError.PrimaryBrandRequired,
    });
  });

  it("move the primary flag to another brand and back", async () => {
    const created = await createBrandAction(brandFields("primary"));
    if (!created.ok) {
      throw new Error(created.error);
    }

    try {
      const swapped = await setPrimaryBrandAction({ id: created.value.id });

      expect(swapped.ok && swapped.value.isPrimary).toBe(true);
      expect(updateTag).toHaveBeenCalledWith(CATALOG_CACHE_TAG);
    } finally {
      await setPrimaryBrandAction({ id: SEED_PRIMARY_BRAND_ID });
    }
  });
});
