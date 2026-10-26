import type { Route } from "next";

/**
 * Storefront URLs of brand pages.
 */
export class BrandPaths {
  private constructor() {}

  /**
   * The shop for the primary brand, or a collab brand's own page.
   * @param brand The brand to link to.
   * @returns Its storefront path.
   */
  static of(brand: { slug: string; isPrimary: boolean }): Route {
    if (brand.isPrimary) {
      return "/shop";
    }

    return `/brands/${brand.slug}` as Route;
  }
}
