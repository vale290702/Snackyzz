import { cacheTag } from "next/cache";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { createServiceClient } from "@/integrations/supabase/service-client";

import { listStorefrontCatalog } from "./storefront.query";
import { CATALOG_CACHE_TAG } from "../mutation";
import { CatalogFixtures, SEED_PRIMARY_BRAND_ID } from "../testing/catalog-fixtures.helper";

vi.mock("next/cache", () => ({ cacheTag: vi.fn(), cacheLife: vi.fn() }));

const service = createServiceClient();
const catalog = () => service.schema("catalog");
const fixture = { brandSlug: "", imageId: "", activeCategoryId: "", archivedCategoryId: "" };

function failOn(error: unknown): void {
  if (error) {
    throw error;
  }
}

async function insertProduct(brandId: string, slug: string, archivedAt: string | null = null) {
  const { data, error } = await catalog()
    .from("products")
    .insert({
      brand_id: brandId,
      slug,
      name: slug,
      description: "Producto de prueba del storefront.",
      accent_color: "#ED781A",
      archived_at: archivedAt,
      image_file_id: slug === "on-sale" ? fixture.imageId : null,
    })
    .select("id")
    .single();
  if (error) {
    throw error;
  }

  return data.id;
}

async function insertCategory(slug: string, archivedAt: string | null): Promise<string> {
  const { data, error } = await catalog()
    .from("categories")
    .insert({ slug, name: slug, archived_at: archivedAt })
    .select("id")
    .single();
  if (error) {
    throw error;
  }

  return data.id;
}

beforeAll(async () => {
  fixture.brandSlug = CatalogFixtures.uniqueSlug("storefront");
  fixture.imageId = await CatalogFixtures.registerFile("product_image");
  fixture.activeCategoryId = await insertCategory(CatalogFixtures.uniqueSlug("active"), null);
  const now = new Date().toISOString();
  fixture.archivedCategoryId = await insertCategory(CatalogFixtures.uniqueSlug("archived"), now);

  const brand = await catalog()
    .from("brands")
    .insert({ slug: fixture.brandSlug, name: "Storefront" })
    .select("id")
    .single();
  if (brand.error) {
    throw brand.error;
  }

  const onSaleId = await insertProduct(brand.data.id, "on-sale");
  const withoutDefaultId = await insertProduct(brand.data.id, "without-default");
  const archivedId = await insertProduct(brand.data.id, "archived", now);

  const links = await catalog()
    .from("product_categories")
    .insert([
      { product_id: onSaleId, category_id: fixture.activeCategoryId },
      { product_id: onSaleId, category_id: fixture.archivedCategoryId },
    ]);
  failOn(links.error);

  // Rows leave out different columns, so missing ones take their defaults rather than null.
  const variants = await catalog()
    .from("product_variants")
    .insert(
      [
        { product_id: onSaleId, name: "Caja", price: 9000, sort_order: 1 },
        { product_id: onSaleId, name: "Unidad", price: 2500, is_default: true },
        { product_id: onSaleId, name: "Retirada", price: 100, archived_at: now },
        { product_id: withoutDefaultId, name: "Sin predeterminada", price: 100 },
        { product_id: archivedId, name: "Archivada", price: 100, is_default: true },
      ],
      { defaultToNull: false },
    );
  failOn(variants.error);
});

describe("listStorefrontCatalog", () => {
  it("lists a brand's products on sale with active variants, categories and image URLs", async () => {
    const result = await listStorefrontCatalog(fixture.brandSlug);

    expect(result.brands.map((brand) => brand.slug)).toEqual([fixture.brandSlug]);
    expect(result.products).toHaveLength(1);

    const [product] = result.products;
    expect(product?.slug).toBe("on-sale");
    expect(product?.variants.map((variant) => [variant.name, variant.isDefault])).toEqual([
      ["Unidad", true],
      ["Caja", false],
    ]);
    expect(product?.categoryIds).toEqual([fixture.activeCategoryId]);
    expect(product?.imageUrl).toContain("/catalog-images/");
    expect(cacheTag).toHaveBeenCalledWith(CATALOG_CACHE_TAG);
  });

  it("lists every active brand and category for the whole shop", async () => {
    const result = await listStorefrontCatalog();
    const brandIds = result.brands.map((brand) => brand.id);
    const categoryIds = result.categories.map((category) => category.id);

    expect(brandIds).toContain(SEED_PRIMARY_BRAND_ID);
    expect(result.brands.filter((brand) => brand.isPrimary)).toHaveLength(1);
    expect(result.brands[0]?.isPrimary).toBe(true);
    expect(categoryIds).toContain(fixture.activeCategoryId);
    expect(categoryIds).not.toContain(fixture.archivedCategoryId);
  });

  it("lists no brands or products for malformed or unknown brand slugs", async () => {
    for (const slug of ["Not A Slug", CatalogFixtures.uniqueSlug("unknown")]) {
      const result = await listStorefrontCatalog(slug);

      expect(result.brands).toEqual([]);
      expect(result.products).toEqual([]);
    }
  });
});
