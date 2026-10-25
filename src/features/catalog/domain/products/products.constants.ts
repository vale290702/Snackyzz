/**
 * Longest product texts; mirrors the `products_*_check` constraints.
 */
export const ProductTextLimit = {
  Name: 120,
  Description: 1000,
  Badge: 30,
} as const;

/**
 * Most categories one product may belong to.
 */
export const MAX_PRODUCT_CATEGORIES = 20;
