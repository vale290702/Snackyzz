import "server-only";

import type { DatabaseClient } from "@/integrations/supabase/database-client.types";

import {
  STOREFRONT_BRAND_COLUMNS,
  STOREFRONT_CATEGORY_COLUMNS,
  STOREFRONT_PRODUCT_COLUMNS,
  storefrontBrandRowSchema,
  storefrontCategoryRowSchema,
  storefrontProductRowSchema,
} from "./storefront.schema";
import type { CategoryDto, StorefrontBrandRow, StorefrontProductRow } from "./storefront.types";

/**
 * Storefront reads. With the anonymous client, RLS returns active rows only.
 * @param client A client acting as a shopper.
 * @returns Reads of active brands, categories and products, in display order.
 */
export function storefrontRepository(client: DatabaseClient) {
  const catalog = () => client.schema("catalog");

  return {
    /**
     * Lists active brands, the primary one first.
     * @returns The brands.
     * @throws When the database request fails.
     */
    async listBrands(): Promise<StorefrontBrandRow[]> {
      const { data, error } = await catalog()
        .from("brands")
        .select(STOREFRONT_BRAND_COLUMNS)
        .order("is_primary", { ascending: false })
        .order("sort_order")
        .order("name");
      if (error) {
        throw error;
      }

      return data.map((row) => storefrontBrandRowSchema.parse(row));
    },

    /**
     * Lists active categories.
     * @returns The categories.
     * @throws When the database request fails.
     */
    async listCategories(): Promise<CategoryDto[]> {
      const { data, error } = await catalog()
        .from("categories")
        .select(STOREFRONT_CATEGORY_COLUMNS)
        .order("sort_order")
        .order("name");
      if (error) {
        throw error;
      }

      return data.map((row) => storefrontCategoryRowSchema.parse(row));
    },

    /**
     * Lists active products with their visible category links and active variants.
     * @returns The products.
     * @throws When the database request fails.
     */
    async listProducts(): Promise<StorefrontProductRow[]> {
      const { data, error } = await catalog()
        .from("products")
        .select(STOREFRONT_PRODUCT_COLUMNS)
        .order("sort_order")
        .order("name")
        .order("sort_order", { referencedTable: "product_variants" })
        .order("name", { referencedTable: "product_variants" });
      if (error) {
        throw error;
      }

      return data.map((row) => storefrontProductRowSchema.parse(row));
    },
  };
}
