import { describe, expect, it } from "vitest";
import { z } from "zod";

import { CategoryTextLimit } from "./categories.constants";
import { categoryInputSchema, updateCategoryInputSchema } from "./categories.schema";
import { CatalogFieldError } from "../fields";

describe("categoryInputSchema", () => {
  it("parses a category with a default sort order", () => {
    expect(categoryInputSchema.parse({ slug: "clasicas", name: " Clásicas " })).toEqual({
      slug: "clasicas",
      name: "Clásicas",
      sortOrder: 0,
    });
  });

  it("reports each field's code", () => {
    const parsed = categoryInputSchema.safeParse({
      slug: "",
      name: "a".repeat(CategoryTextLimit.Name + 1),
      sortOrder: -1,
    });

    expect(parsed.error && z.flattenError(parsed.error).fieldErrors).toEqual({
      slug: [CatalogFieldError.SlugInvalid],
      name: [CatalogFieldError.TooLong],
      sortOrder: [CatalogFieldError.SortOrderInvalid],
    });
  });
});

describe("updateCategoryInputSchema", () => {
  it("requires the category's id", () => {
    const parsed = updateCategoryInputSchema.safeParse({ slug: "clasicas", name: "Clásicas" });

    expect(parsed.error && z.flattenError(parsed.error).fieldErrors).toEqual({
      id: [CatalogFieldError.ReferenceInvalid],
    });
  });
});
