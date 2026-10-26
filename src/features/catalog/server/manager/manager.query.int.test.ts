import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createServiceClient } from "@/integrations/supabase/service-client";

import { getCatalogManager } from "./manager.query";
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
// Outside a Next server `forbidden()` refuses to run, since the config flag isn't loaded.
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  forbidden: () => {
    throw new Error("forbidden");
  },
}));
const fixture = { archivedBrandSlug: "", logoId: "" };

beforeAll(async () => {
  fixture.archivedBrandSlug = CatalogFixtures.uniqueSlug("manager-archived");
  fixture.logoId = await CatalogFixtures.registerFile("brand_logo");

  const { error } = await createServiceClient().schema("catalog").from("brands").insert({
    slug: fixture.archivedBrandSlug,
    name: "Archivada",
    logo_file_id: fixture.logoId,
    archived_at: new Date().toISOString(),
  });
  if (error) {
    throw error;
  }
});

beforeEach(() => {
  RequestCookies.clear();
});

describe("getCatalogManager", () => {
  it("sends visitors to sign-in", async () => {
    await expect(getCatalogManager()).rejects.toMatchObject(SIGN_IN_REDIRECT);
  });

  it("refuses staff, who may not manage the catalog", async () => {
    await CatalogFixtures.signInAs(DemoAdmin.Staff.email);

    await expect(getCatalogManager()).rejects.toThrow("forbidden");
  });

  it("lists every row for owners, archived ones and logo URLs included", async () => {
    await CatalogFixtures.signInAs(DemoAdmin.Owner.email);

    const data = await getCatalogManager();

    expect(data.brands[0]?.id).toBe(SEED_PRIMARY_BRAND_ID);
    expect(data.brands.find((brand) => brand.slug === fixture.archivedBrandSlug)).toMatchObject({
      archivedAt: expect.any(String),
      logoFileId: fixture.logoId,
      logoUrl: expect.stringContaining("catalog-images"),
    });
    expect(data.categories.length).toBeGreaterThan(0);
    expect(data.products.some((product) => product.slug === "choco-cloud")).toBe(true);
    expect(data.variants.some((variant) => variant.sku === "SNK-CHOCO-CLOUD")).toBe(true);
  });
});
