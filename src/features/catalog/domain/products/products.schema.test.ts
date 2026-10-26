import { describe, expect, it } from "vitest";
import { z } from "zod";

import { MAX_PRODUCT_CATEGORIES } from "./products.constants";
import { productInputSchema } from "./products.schema";
import { CatalogFieldError } from "../fields";

const BRAND_ID = "00000000-0000-7000-8000-0000000000b1";
const CATEGORY_ID = "00000000-0000-7000-8000-0000000000c1";

const product = {
  brandId: BRAND_ID,
  slug: "choco-cloud",
  name: "Choco Cloud",
  description: "Una galleta de muestra.",
  accentColor: "#ED781A",
};

describe("productInputSchema", () => {
  it("defaults the image, badge, sort order and categories", () => {
    expect(productInputSchema.parse(product)).toEqual({
      ...product,
      badge: null,
      imageFileId: null,
      sortOrder: 0,
      categoryIds: [],
    });
  });

  it("removes repeated categories", () => {
    const parsed = productInputSchema.parse({
      ...product,
      categoryIds: [CATEGORY_ID, CATEGORY_ID],
    });

    expect(parsed.categoryIds).toEqual([CATEGORY_ID]);
  });

  it("reports each field's code", () => {
    const parsed = productInputSchema.safeParse({
      ...product,
      brandId: "snackyzz",
      description: " ",
      accentColor: "orange",
      categoryIds: Array.from({ length: MAX_PRODUCT_CATEGORIES + 1 }, () => CATEGORY_ID),
    });

    expect(parsed.error && z.flattenError(parsed.error).fieldErrors).toEqual({
      brandId: [CatalogFieldError.ReferenceInvalid],
      description: [CatalogFieldError.Required],
      accentColor: [CatalogFieldError.AccentColorInvalid],
      categoryIds: [CatalogFieldError.TooLong],
    });
  });
});
