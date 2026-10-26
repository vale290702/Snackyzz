import "server-only";

import type { Database, DatabaseClient } from "@/integrations/supabase/database-client.types";
import type { Result } from "@/shared/lib/result";

import { CATEGORY_COLUMNS, categoryRowSchema } from "./categories.schema";
import type { Category } from "./categories.types";
import type { CategoryInput } from "../../domain/categories";
import { CatalogError, type CatalogErrorCode } from "../../domain/errors";
import { CatalogResults } from "../mutation";

type CategoryResult = Result<Category, CatalogErrorCode>;

/**
 * Data access for `catalog.categories`, acting as the signed-in admin; RLS requires `catalog.manage`.
 * @param client The admin's RLS-scoped client.
 * @returns Category writes that return parsed categories or expected failures.
 */
export function categoriesRepository(client: DatabaseClient) {
  const categories = () => client.schema("catalog").from("categories");

  return {
    /**
     * Creates a category attributed to the admin.
     * @param input The validated category.
     * @param adminId The admin creating it.
     * @returns The category, or `slug_taken`.
     * @throws When the database fails unexpectedly.
     */
    async insert(input: CategoryInput, adminId: string): Promise<CategoryResult> {
      const response = await categories()
        .insert({ ...toRow(input), created_by: adminId, updated_by: adminId })
        .select(CATEGORY_COLUMNS)
        .single();

      return CatalogResults.fromResponse(
        response,
        categoryRowSchema,
        CatalogError.CategoryNotFound,
      );
    },

    /**
     * Replaces an active category's fields.
     * @param id The category.
     * @param input The validated fields.
     * @param adminId The admin editing it.
     * @returns The category, or `category_not_found` when it is missing or archived.
     * @throws When the database fails unexpectedly.
     */
    async update(id: string, input: CategoryInput, adminId: string): Promise<CategoryResult> {
      const response = await categories()
        .update({ ...toRow(input), updated_by: adminId })
        .eq("id", id)
        .is("archived_at", null)
        .select(CATEGORY_COLUMNS)
        .maybeSingle();

      return CatalogResults.fromResponse(
        response,
        categoryRowSchema,
        CatalogError.CategoryNotFound,
      );
    },

    /**
     * Archives an active category; its products stay, and the storefront stops listing the link.
     * @param id The category.
     * @param adminId The admin archiving it.
     * @returns The archived category, or `category_not_found`.
     * @throws When the database fails unexpectedly.
     */
    async archive(id: string, adminId: string): Promise<CategoryResult> {
      const response = await categories()
        .update({ archived_at: new Date().toISOString(), updated_by: adminId })
        .eq("id", id)
        .is("archived_at", null)
        .select(CATEGORY_COLUMNS)
        .maybeSingle();

      return CatalogResults.fromResponse(
        response,
        categoryRowSchema,
        CatalogError.CategoryNotFound,
      );
    },
  };
}

function toRow(input: CategoryInput): Database["catalog"]["Tables"]["categories"]["Insert"] {
  return {
    slug: input.slug,
    name: input.name,
    sort_order: input.sortOrder,
  };
}
