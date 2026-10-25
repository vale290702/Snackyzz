import { describe, expect, it } from "vitest";
import { z } from "zod";

import { BrandTextLimit } from "./brands.constants";
import { brandInputSchema, updateBrandInputSchema } from "./brands.schema";
import { CatalogFieldError } from "../fields";

const BRAND_ID = "00000000-0000-7000-8000-0000000000b1";

describe("brandInputSchema", () => {
  it("fills optional fields with null and the sort order with zero", () => {
    expect(brandInputSchema.parse({ slug: "snackyzz", name: "Snackyzz" })).toEqual({
      slug: "snackyzz",
      name: "Snackyzz",
      tagline: null,
      description: null,
      label: null,
      logoFileId: null,
      sortOrder: 0,
    });
  });

  it("does not accept the primary flag", () => {
    const parsed = brandInputSchema.parse({ slug: "snackyzz", name: "Snackyzz", isPrimary: true });

    expect(parsed).not.toHaveProperty("isPrimary");
  });

  it("reports each field's code", () => {
    const parsed = brandInputSchema.safeParse({
      slug: "Snackyzz",
      name: "",
      label: "a".repeat(BrandTextLimit.Label + 1),
      logoFileId: "logo.png",
    });

    expect(parsed.error && z.flattenError(parsed.error).fieldErrors).toEqual({
      slug: [CatalogFieldError.SlugInvalid],
      name: [CatalogFieldError.Required],
      label: [CatalogFieldError.TooLong],
      logoFileId: [CatalogFieldError.ReferenceInvalid],
    });
  });
});

describe("updateBrandInputSchema", () => {
  it("requires the brand's id", () => {
    const fields = { slug: "snackyzz", name: "Snackyzz" };

    expect(updateBrandInputSchema.safeParse(fields).success).toBe(false);
    expect(updateBrandInputSchema.parse({ ...fields, id: BRAND_ID }).id).toBe(BRAND_ID);
  });
});
