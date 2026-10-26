import "server-only";

import type { Database, DatabaseClient } from "@/integrations/supabase/database-client.types";
import type { Result } from "@/shared/lib/result";

import { productDefaultRowSchema, VARIANT_COLUMNS, variantRowSchema } from "./variants.schema";
import type { ProductDefault, Variant, VariantFields } from "./variants.types";
import { CatalogError, type CatalogErrorCode } from "../../domain/errors";
import type { VariantInput } from "../../domain/variants";
import { CatalogResults } from "../mutation";

type VariantResult = Result<Variant, CatalogErrorCode>;

/**
 * Data access for `catalog.product_variants`, acting as the signed-in admin; RLS requires
 * `catalog.manage`. Price history is written by the database, never here.
 * @param client The admin's RLS-scoped client.
 * @returns Variant writes that return parsed variants or expected failures.
 */
export function variantsRepository(client: DatabaseClient) {
  return {
    findProductDefault: (productId: string) => findProductDefault(client, productId),
    insert: (input: VariantInput, adminId: string, isDefault: boolean) =>
      insert(client, input, adminId, isDefault),
    update: (id: string, input: VariantFields, adminId: string) =>
      update(client, id, input, adminId),
    archive: (id: string, adminId: string) => archive(client, id, adminId),
    setDefault: (id: string) => setDefault(client, id),
  };
}

/**
 * Reads whether an active product already has a default variant.
 * @param client The admin's client.
 * @param productId The product.
 * @returns Whether it has one, or `product_not_found` when it is missing or archived.
 * @throws When the database fails unexpectedly.
 */
async function findProductDefault(
  client: DatabaseClient,
  productId: string,
): Promise<Result<ProductDefault, CatalogErrorCode>> {
  const response = await client
    .schema("catalog")
    .from("products")
    .select("id, product_variants(id)")
    .eq("id", productId)
    .is("archived_at", null)
    .eq("product_variants.is_default", true)
    .maybeSingle();

  return CatalogResults.fromResponse(
    response,
    productDefaultRowSchema,
    CatalogError.ProductNotFound,
  );
}

/**
 * Creates a variant attributed to the admin; the database logs its first price.
 * @param client The admin's client.
 * @param input The validated variant.
 * @param adminId The admin creating it.
 * @param isDefault Whether it becomes its product's default.
 * @returns The variant, or `sku_taken` / `product_not_found`.
 * @throws When the database fails unexpectedly.
 */
async function insert(
  client: DatabaseClient,
  input: VariantInput,
  adminId: string,
  isDefault: boolean,
): Promise<VariantResult> {
  const response = await variants(client)
    .insert({
      ...toRow(input),
      product_id: input.productId,
      is_default: isDefault,
      created_by: adminId,
      updated_by: adminId,
    })
    .select(VARIANT_COLUMNS)
    .single();

  return CatalogResults.fromResponse(response, variantRowSchema, CatalogError.VariantNotFound);
}

/**
 * Replaces an active variant's fields; the database logs a new price with the admin.
 * @param client The admin's client.
 * @param id The variant.
 * @param input The validated fields.
 * @param adminId The admin editing it.
 * @returns The variant, or `variant_not_found` when it is missing or archived.
 * @throws When the database fails unexpectedly.
 */
async function update(
  client: DatabaseClient,
  id: string,
  input: VariantFields,
  adminId: string,
): Promise<VariantResult> {
  const response = await variants(client)
    .update({ ...toRow(input), updated_by: adminId })
    .eq("id", id)
    .is("archived_at", null)
    .select(VARIANT_COLUMNS)
    .maybeSingle();

  return CatalogResults.fromResponse(response, variantRowSchema, CatalogError.VariantNotFound);
}

/**
 * Archives an active variant; the default variant refuses with `default_variant_required`.
 * @param client The admin's client.
 * @param id The variant.
 * @param adminId The admin archiving it.
 * @returns The archived variant, or why it was not archived.
 * @throws When the database fails unexpectedly.
 */
async function archive(
  client: DatabaseClient,
  id: string,
  adminId: string,
): Promise<VariantResult> {
  const response = await variants(client)
    .update({ archived_at: new Date().toISOString(), updated_by: adminId })
    .eq("id", id)
    .is("archived_at", null)
    .select(VARIANT_COLUMNS)
    .maybeSingle();

  return CatalogResults.fromResponse(response, variantRowSchema, CatalogError.VariantNotFound);
}

/**
 * Makes an active variant its product's default, in one transaction with unsetting the old one.
 * @param client The admin's client.
 * @param id The variant.
 * @returns The new default variant, or `variant_not_found`.
 * @throws When the database fails unexpectedly.
 */
async function setDefault(client: DatabaseClient, id: string): Promise<VariantResult> {
  const { error } = await client.schema("catalog").rpc("set_default_variant", { p_variant_id: id });
  if (error) {
    return CatalogResults.fromError(error);
  }

  const response = await variants(client).select(VARIANT_COLUMNS).eq("id", id).maybeSingle();

  return CatalogResults.fromResponse(response, variantRowSchema, CatalogError.VariantNotFound);
}

function variants(client: DatabaseClient) {
  return client.schema("catalog").from("product_variants");
}

function toRow(
  input: VariantFields,
): Omit<Database["catalog"]["Tables"]["product_variants"]["Insert"], "product_id"> {
  return {
    sku: input.sku,
    name: input.name,
    price: input.price,
    is_stock_tracked: input.isStockTracked,
    sort_order: input.sortOrder,
  };
}
