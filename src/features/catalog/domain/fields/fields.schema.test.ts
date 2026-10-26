import { describe, expect, it } from "vitest";
import type { z } from "zod";

import { CatalogFieldError, INTEGER_MAX, SLUG_MAX_LENGTH } from "./fields.constants";
import { CatalogFields, recordIdInputSchema } from "./fields.schema";

function firstIssue(schema: z.ZodType, input: unknown): string | undefined {
  const parsed = schema.safeParse(input);

  return parsed.success ? undefined : parsed.error.issues[0]?.message;
}

describe("CatalogFields.slug", () => {
  it("accepts lowercase letters, digits and hyphens", () => {
    expect(CatalogFields.slug.parse(" baking-stereo-2 ")).toBe("baking-stereo-2");
  });

  it("reports slug_invalid for capitals, spaces, accents and blanks", () => {
    for (const slug of ["Baking", "baking stereo", "clásicas", "", 7]) {
      expect(firstIssue(CatalogFields.slug, slug), String(slug)).toBe(
        CatalogFieldError.SlugInvalid,
      );
    }
  });

  it("reports field_too_long past the SQL limit", () => {
    expect(firstIssue(CatalogFields.slug, "a".repeat(SLUG_MAX_LENGTH + 1))).toBe(
      CatalogFieldError.TooLong,
    );
  });
});

describe("CatalogFields.accentColor", () => {
  it("accepts #RRGGBB in either case", () => {
    expect(CatalogFields.accentColor.parse("#ed781A")).toBe("#ed781A");
  });

  it("reports accent_color_invalid for names and short colors", () => {
    for (const color of ["orange", "#FFF", "ED781A", "#GG0000"]) {
      expect(firstIssue(CatalogFields.accentColor, color), color).toBe(
        CatalogFieldError.AccentColorInvalid,
      );
    }
  });
});

describe("CatalogFields.price", () => {
  it("coerces form text into whole colones", () => {
    expect(CatalogFields.price.parse("2500")).toBe(2500);
  });

  it("reports price_invalid for zero, negatives, fractions, blanks and integer overflow", () => {
    for (const price of [0, -1, 2500.5, "", "abc", INTEGER_MAX + 1]) {
      expect(firstIssue(CatalogFields.price, price), String(price)).toBe(
        CatalogFieldError.PriceInvalid,
      );
    }
  });
});

describe("CatalogFields.sortOrder", () => {
  it("defaults to zero and coerces form text", () => {
    expect(CatalogFields.sortOrder.parse(undefined)).toBe(0);
    expect(CatalogFields.sortOrder.parse("3")).toBe(3);
  });

  it("reports sort_order_invalid for negatives and fractions", () => {
    expect(firstIssue(CatalogFields.sortOrder, -1)).toBe(CatalogFieldError.SortOrderInvalid);
    expect(firstIssue(CatalogFields.sortOrder, 1.5)).toBe(CatalogFieldError.SortOrderInvalid);
  });
});

describe("CatalogFields text", () => {
  it("trims required text and reports field_required when blank", () => {
    const name = CatalogFields.requiredText(10);

    expect(name.parse("  Choco  ")).toBe("Choco");
    expect(firstIssue(name, "   ")).toBe(CatalogFieldError.Required);
    expect(firstIssue(name, undefined)).toBe(CatalogFieldError.Required);
    expect(firstIssue(name, "a".repeat(11))).toBe(CatalogFieldError.TooLong);
  });

  it("stores blank or missing optional text as null", () => {
    const tagline = CatalogFields.optionalText(10);

    expect(tagline.parse("  ")).toBeNull();
    expect(tagline.parse(undefined)).toBeNull();
    expect(tagline.parse(null)).toBeNull();
    expect(tagline.parse(" Nuevo ")).toBe("Nuevo");
    expect(firstIssue(tagline, "a".repeat(11))).toBe(CatalogFieldError.TooLong);
  });
});

describe("references", () => {
  it("defaults a missing file id to null", () => {
    expect(CatalogFields.fileId.parse(undefined)).toBeNull();
  });

  it("reports reference_invalid for ids that are not UUIDs", () => {
    expect(firstIssue(CatalogFields.fileId, "../secret")).toBe(CatalogFieldError.ReferenceInvalid);
    expect(firstIssue(recordIdInputSchema, { id: "42" })).toBe(CatalogFieldError.ReferenceInvalid);
  });
});
