import { describe, expect, it } from "vitest";
import { z } from "zod";

import { updateVariantInputSchema, variantInputSchema } from "./variants.schema";
import { CatalogFieldError } from "../fields";

const PRODUCT_ID = "00000000-0000-7000-8000-0000000000d1";
const VARIANT_ID = "00000000-0000-7000-8000-0000000000e1";

describe("variantInputSchema", () => {
  it("tracks stock by default and stores a blank SKU as null", () => {
    expect(
      variantInputSchema.parse({ productId: PRODUCT_ID, sku: "", name: "Unidad", price: "2500" }),
    ).toEqual({
      productId: PRODUCT_ID,
      sku: null,
      name: "Unidad",
      price: 2500,
      isStockTracked: true,
      sortOrder: 0,
    });
  });

  it("reports price_invalid for a free variant", () => {
    const parsed = variantInputSchema.safeParse({
      productId: PRODUCT_ID,
      name: "Gratis",
      price: 0,
    });

    expect(parsed.error && z.flattenError(parsed.error).fieldErrors).toEqual({
      price: [CatalogFieldError.PriceInvalid],
    });
  });

  it("does not accept the default flag", () => {
    const parsed = variantInputSchema.parse({
      productId: PRODUCT_ID,
      name: "Unidad",
      price: 2500,
      isDefault: true,
    });

    expect(parsed).not.toHaveProperty("isDefault");
  });
});

describe("updateVariantInputSchema", () => {
  it("keeps the variant on its product", () => {
    const parsed = updateVariantInputSchema.parse({
      id: VARIANT_ID,
      productId: PRODUCT_ID,
      name: "Unidad",
      price: 2500,
    });

    expect(parsed).not.toHaveProperty("productId");
  });
});
