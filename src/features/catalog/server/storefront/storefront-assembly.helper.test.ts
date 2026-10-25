import { describe, expect, it } from "vitest";

import type { CatalogImage } from "@/features/media";

import { StorefrontAssembly } from "./storefront-assembly.helper";
import type { StorefrontBrandRow, StorefrontProductRow, StorefrontRows } from "./storefront.types";

const PRIMARY_ID = "00000000-0000-7000-8000-0000000000b1";
const COLLAB_ID = "00000000-0000-7000-8000-0000000000b2";
const LOGO_ID = "00000000-0000-7000-8000-0000000000f1";
const IMAGE_ID = "00000000-0000-7000-8000-0000000000f2";

function brand(id: string, slug: string, logoFileId: string | null = null): StorefrontBrandRow {
  return {
    id,
    slug,
    name: slug,
    tagline: null,
    description: null,
    label: null,
    isPrimary: id === PRIMARY_ID,
    logoFileId,
  };
}

function product(
  slug: string,
  brandId: string,
  options: { isDefault?: boolean; imageFileId?: string | null } = {},
): StorefrontProductRow {
  return {
    id: `${slug}-id`,
    brandId,
    slug,
    name: slug,
    description: "Una galleta.",
    badge: null,
    accentColor: "#ED781A",
    imageFileId: options.imageFileId ?? null,
    categoryIds: [],
    variants: [
      {
        id: `${slug}-variant`,
        sku: null,
        name: "Unidad",
        price: 2500,
        isDefault: options.isDefault ?? true,
        isStockTracked: true,
      },
    ],
  };
}

function image(id: string): CatalogImage {
  return {
    ref: {
      id,
      purpose: "product_image",
      mimeType: "image/png",
      sizeBytes: 1,
      width: 1,
      height: 1,
    },
    url: `https://cdn.test/${id}.png`,
  };
}

const rows: StorefrontRows = {
  brands: [brand(PRIMARY_ID, "snackyzz", LOGO_ID), brand(COLLAB_ID, "baking-stereo")],
  categories: [{ id: "category-id", slug: "clasicas", name: "Clásicas" }],
  products: [
    product("chocolate-chip", COLLAB_ID),
    product("choco-cloud", PRIMARY_ID, { imageFileId: IMAGE_ID }),
    product("draft", PRIMARY_ID, { isDefault: false }),
    product("orphan", "00000000-0000-7000-8000-0000000000b9"),
  ],
};

describe("StorefrontAssembly.build", () => {
  it("lists products of listed brands that have a default variant, grouped in brand order", () => {
    const catalog = StorefrontAssembly.build(rows, new Map(), null);

    expect(catalog.products.map((entry) => entry.slug)).toEqual(["choco-cloud", "chocolate-chip"]);
    expect(catalog.categories).toBe(rows.categories);
  });

  it("narrows to one brand by slug", () => {
    const catalog = StorefrontAssembly.build(rows, new Map(), "baking-stereo");

    expect(catalog.brands.map((entry) => entry.slug)).toEqual(["baking-stereo"]);
    expect(catalog.products.map((entry) => entry.slug)).toEqual(["chocolate-chip"]);
  });

  it("is empty for a slug no active brand has", () => {
    const catalog = StorefrontAssembly.build(rows, new Map(), "unknown");

    expect(catalog.brands).toEqual([]);
    expect(catalog.products).toEqual([]);
  });

  it("swaps file ids for image URLs, and renders a missing image as none", () => {
    const images = new Map([[IMAGE_ID, image(IMAGE_ID)]]);

    const catalog = StorefrontAssembly.build(rows, images, "snackyzz");

    expect(catalog.brands[0]).not.toHaveProperty("logoFileId");
    expect(catalog.brands[0]?.logoUrl).toBeNull();
    expect(catalog.products[0]).not.toHaveProperty("imageFileId");
    expect(catalog.products[0]?.imageUrl).toBe(`https://cdn.test/${IMAGE_ID}.png`);
  });
});

describe("StorefrontAssembly.imageFileIds", () => {
  it("collects distinct logo and product image ids", () => {
    const withRepeat = {
      ...rows,
      products: [...rows.products, product("again", PRIMARY_ID, { imageFileId: IMAGE_ID })],
    };

    expect(StorefrontAssembly.imageFileIds(withRepeat).sort()).toEqual([LOGO_ID, IMAGE_ID].sort());
  });
});
