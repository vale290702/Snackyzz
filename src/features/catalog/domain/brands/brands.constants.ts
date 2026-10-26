/**
 * Longest brand texts; mirrors the `brands_*_check` constraints.
 */
export const BrandTextLimit = {
  Name: 80,
  Tagline: 160,
  Description: 1000,
  Label: 80,
} as const;
