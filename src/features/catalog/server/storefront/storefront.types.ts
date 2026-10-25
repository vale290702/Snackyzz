import type { z } from "zod";

import type {
  storefrontBrandRowSchema,
  storefrontCategoryRowSchema,
  storefrontProductRowSchema,
  storefrontVariantRowSchema,
} from "./storefront.schema";

/**
 * An active brand row, before its logo is resolved to a URL.
 */
export type StorefrontBrandRow = z.output<typeof storefrontBrandRowSchema>;

/**
 * An active product row, before its image is resolved to a URL.
 */
export type StorefrontProductRow = z.output<typeof storefrontProductRowSchema>;

/**
 * Everything the storefront reads, before images are resolved.
 */
export type StorefrontRows = {
  brands: StorefrontBrandRow[];
  categories: CategoryDto[];
  products: StorefrontProductRow[];
};

/**
 * A brand on the storefront. Copy is data; never branch on its name or slug.
 */
export type BrandDto = Omit<StorefrontBrandRow, "logoFileId"> & {
  logoUrl: string | null;
};

/**
 * A category a shopper can filter by.
 */
export type CategoryDto = z.output<typeof storefrontCategoryRowSchema>;

/**
 * One way to buy a product. Carts and orders reference variants, never products.
 */
export type VariantDto = z.output<typeof storefrontVariantRowSchema>;

/**
 * A product on sale: it has exactly one default variant. One variant renders as a simple product.
 */
export type ProductDto = Omit<StorefrontProductRow, "imageFileId"> & {
  imageUrl: string | null;
};

/**
 * The storefront catalog: brands with the primary first, categories, and products on sale.
 */
export type StorefrontCatalog = {
  brands: BrandDto[];
  categories: CategoryDto[];
  products: ProductDto[];
};
