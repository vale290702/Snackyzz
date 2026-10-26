import "server-only";

import type { Database, DatabaseClient } from "@/integrations/supabase/database-client.types";
import { Results, type Result } from "@/shared/lib/result";

import { PRODUCT_COLUMNS, productRowSchema } from "./products.schema";
import type { Product } from "./products.types";
import { CatalogError, type CatalogErrorCode } from "../../domain/errors";
import type { ProductInput } from "../../domain/products";
import { CatalogResults } from "../mutation";

type ProductResult = Result<Product, CatalogErrorCode>;

/**
 * Data access for `catalog.products` and their category links, acting as the signed-in admin;
 * RLS requires `catalog.manage`.
 * @param client The admin's RLS-scoped client.
 * @returns Product writes that return parsed products or expected failures.
 */
export function productsRepository(client: DatabaseClient) {
  return {
    canLinkCategories: (categoryIds: string[]) => canLinkCategories(client, categoryIds),
    insert: (input: ProductInput, adminId: string) => insert(client, input, adminId),
    update: (id: string, input: ProductInput, adminId: string) =>
      update(client, id, input, adminId),
    archive: (id: string, adminId: string) => archive(client, id, adminId),
  };
}

/**
 * Tells whether every category exists and is active, so a product is not left half-linked.
 * @param client The admin's client.
 * @param categoryIds The categories to link.
 * @returns True when all of them can be linked.
 * @throws When the database request fails.
 */
async function canLinkCategories(client: DatabaseClient, categoryIds: string[]): Promise<boolean> {
  if (categoryIds.length === 0) {
    return true;
  }

  const { data, error } = await client
    .schema("catalog")
    .from("categories")
    .select("id")
    .in("id", categoryIds)
    .is("archived_at", null);
  if (error) {
    throw error;
  }

  return data.length === categoryIds.length;
}

/**
 * Creates a product attributed to the admin and links its categories.
 * @param client The admin's client.
 * @param input The validated product.
 * @param adminId The admin creating it.
 * @returns The product, or `slug_taken`, `brand_not_found`, `invalid_image`, `category_not_found`.
 * @throws When the database fails unexpectedly.
 */
async function insert(
  client: DatabaseClient,
  input: ProductInput,
  adminId: string,
): Promise<ProductResult> {
  const { data, error } = await products(client)
    .insert({ ...toRow(input), created_by: adminId, updated_by: adminId })
    .select("id")
    .single();
  if (error) {
    return CatalogResults.fromError(error);
  }

  return linkCategories(client, data.id, input.categoryIds);
}

/**
 * Replaces an active product's fields and categories.
 * @param client The admin's client.
 * @param id The product.
 * @param input The validated fields.
 * @param adminId The admin editing it.
 * @returns The product, or `product_not_found` when it is missing or archived.
 * @throws When the database fails unexpectedly.
 */
async function update(
  client: DatabaseClient,
  id: string,
  input: ProductInput,
  adminId: string,
): Promise<ProductResult> {
  const { data, error } = await products(client)
    .update({ ...toRow(input), updated_by: adminId })
    .eq("id", id)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();
  if (error) {
    return CatalogResults.fromError(error);
  }

  if (data === null) {
    return Results.err(CatalogError.ProductNotFound);
  }

  return linkCategories(client, id, input.categoryIds);
}

/**
 * Archives an active product; past orders keep referencing its variants.
 * @param client The admin's client.
 * @param id The product.
 * @param adminId The admin archiving it.
 * @returns The archived product, or `product_not_found`.
 * @throws When the database fails unexpectedly.
 */
async function archive(
  client: DatabaseClient,
  id: string,
  adminId: string,
): Promise<ProductResult> {
  const response = await products(client)
    .update({ archived_at: new Date().toISOString(), updated_by: adminId })
    .eq("id", id)
    .is("archived_at", null)
    .select(PRODUCT_COLUMNS)
    .maybeSingle();

  return CatalogResults.fromResponse(response, productRowSchema, CatalogError.ProductNotFound);
}

/**
 * Replaces a product's categories in one transaction, then reads the product back.
 * @param client The admin's client.
 * @param id The product.
 * @param categoryIds Every category it belongs to.
 * @returns The product with its categories, or `category_not_found`.
 * @throws When the database fails unexpectedly.
 */
async function linkCategories(
  client: DatabaseClient,
  id: string,
  categoryIds: string[],
): Promise<ProductResult> {
  const { error } = await client
    .schema("catalog")
    .rpc("set_product_categories", { p_product_id: id, p_category_ids: categoryIds });
  if (error) {
    return CatalogResults.fromError(error);
  }

  const response = await products(client).select(PRODUCT_COLUMNS).eq("id", id).maybeSingle();

  return CatalogResults.fromResponse(response, productRowSchema, CatalogError.ProductNotFound);
}

function products(client: DatabaseClient) {
  return client.schema("catalog").from("products");
}

function toRow(input: ProductInput): Database["catalog"]["Tables"]["products"]["Insert"] {
  return {
    brand_id: input.brandId,
    slug: input.slug,
    name: input.name,
    description: input.description,
    badge: input.badge,
    accent_color: input.accentColor,
    image_file_id: input.imageFileId,
    sort_order: input.sortOrder,
  };
}
