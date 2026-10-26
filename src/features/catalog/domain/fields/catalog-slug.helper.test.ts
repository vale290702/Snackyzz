import { describe, expect, it } from "vitest";

import { CatalogSlug } from "./catalog-slug.helper";

describe("CatalogSlug", () => {
  it("generates a valid readable URL segment from accented names", () => {
    expect(CatalogSlug.fromName("  Limón & Café!  ")).toBe("limon-cafe");
    expect(CatalogSlug.fromName("A".repeat(200))).toHaveLength(60);
  });
});
