/**
 * Catalog record lists that support ordering.
 */
export const CatalogOrderKind = {
  Products: "products",
  Brands: "brands",
  Categories: "categories",
  Variants: "variants",
} as const;

/**
 * Adjacent moves in a catalog list.
 */
export const CatalogOrderDirection = {
  Up: "up",
  Down: "down",
} as const;
