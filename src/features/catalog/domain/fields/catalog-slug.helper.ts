import { SLUG_MAX_LENGTH } from "./fields.constants";

/**
 * Generates URL segments under the catalog's existing slug constraints.
 */
export class CatalogSlug {
  private constructor() {}

  /**
   * Derives a slug from a name without changing existing stored slugs.
   * @param name The editable catalog name.
   * @returns A normalized segment within the database length limit.
   */
  static fromName(name: string): string {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, SLUG_MAX_LENGTH)
      .replace(/-$/, "");
  }
}
