import type { Brand } from "../brands";
import type { Category } from "../categories";
import type { Product } from "../products";
import type { Variant } from "../variants";

/**
 * A brand in catalog management, with its logo's public URL.
 */
export type ManagedBrand = Brand & {
  logoUrl: string | null;
};

/**
 * A product in catalog management, with its image's public URL.
 */
export type ManagedProduct = Product & {
  imageUrl: string | null;
};

/**
 * Every brand, category, product and variant, archived or not, for catalog management.
 */
export type CatalogManagerData = {
  brands: ManagedBrand[];
  categories: Category[];
  products: ManagedProduct[];
  variants: Variant[];
};
