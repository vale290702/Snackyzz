import "server-only";

import type { Database, DatabaseClient } from "@/integrations/supabase/database-client.types";
import type { Result } from "@/shared/lib/result";

import { BRAND_COLUMNS, brandRowSchema } from "./brands.schema";
import type { Brand } from "./brands.types";
import type { BrandInput } from "../../domain/brands";
import { CatalogError, type CatalogErrorCode } from "../../domain/errors";
import { CatalogResults } from "../mutation";

type BrandResult = Result<Brand, CatalogErrorCode>;

/**
 * Data access for `catalog.brands`, acting as the signed-in admin; RLS requires `catalog.manage`.
 * @param client The admin's RLS-scoped client.
 * @returns Brand reads and writes that return parsed brands or expected failures.
 */
export function brandsRepository(client: DatabaseClient) {
  return {
    hasPrimary: () => hasPrimary(client),
    insert: (input: BrandInput, adminId: string, isPrimary: boolean) =>
      insert(client, input, adminId, isPrimary),
    update: (id: string, input: BrandInput, adminId: string) => update(client, id, input, adminId),
    archive: (id: string, adminId: string) => archive(client, id, adminId),
    setPrimary: (id: string) => setPrimary(client, id),
  };
}

/**
 * Tells whether any brand is primary; there is none only before the first brand exists.
 * @param client The admin's client.
 * @returns True when a primary brand exists.
 * @throws When the database request fails.
 */
async function hasPrimary(client: DatabaseClient): Promise<boolean> {
  const { data, error } = await brands(client).select("id").eq("is_primary", true).maybeSingle();
  if (error) {
    throw error;
  }

  return data !== null;
}

/**
 * Creates a brand attributed to the admin.
 * @param client The admin's client.
 * @param input The validated brand.
 * @param adminId The admin creating it.
 * @param isPrimary Whether it becomes the primary brand.
 * @returns The brand, or `slug_taken` / `invalid_image`.
 * @throws When the database fails unexpectedly.
 */
async function insert(
  client: DatabaseClient,
  input: BrandInput,
  adminId: string,
  isPrimary: boolean,
): Promise<BrandResult> {
  const response = await brands(client)
    .insert({
      ...toRow(input),
      is_primary: isPrimary,
      created_by: adminId,
      updated_by: adminId,
    })
    .select(BRAND_COLUMNS)
    .single();

  return CatalogResults.fromResponse(response, brandRowSchema, CatalogError.BrandNotFound);
}

/**
 * Replaces an active brand's editable fields.
 * @param client The admin's client.
 * @param id The brand.
 * @param input The validated fields.
 * @param adminId The admin editing it.
 * @returns The brand, or `brand_not_found` when it is missing or archived.
 * @throws When the database fails unexpectedly.
 */
async function update(
  client: DatabaseClient,
  id: string,
  input: BrandInput,
  adminId: string,
): Promise<BrandResult> {
  const response = await brands(client)
    .update({ ...toRow(input), updated_by: adminId })
    .eq("id", id)
    .is("archived_at", null)
    .select(BRAND_COLUMNS)
    .maybeSingle();

  return CatalogResults.fromResponse(response, brandRowSchema, CatalogError.BrandNotFound);
}

/**
 * Archives an active brand; the primary brand refuses with `primary_brand_required`.
 * @param client The admin's client.
 * @param id The brand.
 * @param adminId The admin archiving it.
 * @returns The archived brand, or why it was not archived.
 * @throws When the database fails unexpectedly.
 */
async function archive(client: DatabaseClient, id: string, adminId: string): Promise<BrandResult> {
  const response = await brands(client)
    .update({ archived_at: new Date().toISOString(), updated_by: adminId })
    .eq("id", id)
    .is("archived_at", null)
    .select(BRAND_COLUMNS)
    .maybeSingle();

  return CatalogResults.fromResponse(response, brandRowSchema, CatalogError.BrandNotFound);
}

/**
 * Makes an active brand the primary one, in one transaction with unsetting the previous one.
 * @param client The admin's client.
 * @param id The brand.
 * @returns The new primary brand, or `brand_not_found`.
 * @throws When the database fails unexpectedly.
 */
async function setPrimary(client: DatabaseClient, id: string): Promise<BrandResult> {
  const { error } = await client.schema("catalog").rpc("set_primary_brand", { p_brand_id: id });
  if (error) {
    return CatalogResults.fromError(error);
  }

  const response = await brands(client).select(BRAND_COLUMNS).eq("id", id).maybeSingle();

  return CatalogResults.fromResponse(response, brandRowSchema, CatalogError.BrandNotFound);
}

function brands(client: DatabaseClient) {
  return client.schema("catalog").from("brands");
}

function toRow(input: BrandInput): Database["catalog"]["Tables"]["brands"]["Insert"] {
  return {
    slug: input.slug,
    name: input.name,
    tagline: input.tagline,
    description: input.description,
    label: input.label,
    logo_file_id: input.logoFileId,
    sort_order: input.sortOrder,
  };
}
