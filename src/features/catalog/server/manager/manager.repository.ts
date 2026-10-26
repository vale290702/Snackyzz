import "server-only";

import type { DatabaseClient } from "@/integrations/supabase/database-client.types";

import type { Brand } from "../brands";
import { BRAND_COLUMNS, brandRowSchema } from "../brands/brands.schema";
import type { Category } from "../categories";
import { CATEGORY_COLUMNS, categoryRowSchema } from "../categories/categories.schema";
import type { Product } from "../products";
import { PRODUCT_COLUMNS, productRowSchema } from "../products/products.schema";
import type { Variant } from "../variants";
import { VARIANT_COLUMNS, variantRowSchema } from "../variants/variants.schema";

/**
 * Catalog management reads, acting as the signed-in admin; RLS shows archived rows only to
 * `catalog.manage`.
 * @param client The admin's RLS-scoped client.
 * @returns Reads of every brand, category, product and variant, in display order.
 */
export function managerRepository(client: DatabaseClient) {
  const catalog = () => client.schema("catalog");

  return {
    /**
     * Lists brands, the primary one first.
     * @returns The brands.
     * @throws When the database request fails.
     */
    async listBrands(): Promise<Brand[]> {
      const { data, error } = await catalog()
        .from("brands")
        .select(BRAND_COLUMNS)
        .order("is_primary", { ascending: false })
        .order("sort_order")
        .order("name");
      if (error) {
        throw error;
      }

      return data.map((row) => brandRowSchema.parse(row));
    },

    /**
     * Lists categories.
     * @returns The categories.
     * @throws When the database request fails.
     */
    async listCategories(): Promise<Category[]> {
      const { data, error } = await catalog()
        .from("categories")
        .select(CATEGORY_COLUMNS)
        .order("sort_order")
        .order("name");
      if (error) {
        throw error;
      }

      return data.map((row) => categoryRowSchema.parse(row));
    },

    /**
     * Lists products with their category ids.
     * @returns The products.
     * @throws When the database request fails.
     */
    async listProducts(): Promise<Product[]> {
      const { data, error } = await catalog()
        .from("products")
        .select(PRODUCT_COLUMNS)
        .order("sort_order")
        .order("name");
      if (error) {
        throw error;
      }

      return data.map((row) => productRowSchema.parse(row));
    },

    /**
     * Lists variants of every product.
     * @returns The variants.
     * @throws When the database request fails.
     */
    async listVariants(): Promise<Variant[]> {
      const { data, error } = await catalog()
        .from("product_variants")
        .select(VARIANT_COLUMNS)
        .order("sort_order")
        .order("name");
      if (error) {
        throw error;
      }

      return data.map((row) => variantRowSchema.parse(row));
    },
  };
}
