import "server-only";

import type { AdminContext } from "@/features/access";
import { CapabilityKind, defineCapability } from "@/shared/lib/capability";

import { categoriesRepository } from "./categories.repository";
import { categoryInputSchema, updateCategoryInputSchema } from "../../domain/categories";
import { recordIdInputSchema } from "../../domain/fields";
import { CatalogPermission } from "../mutation";

/**
 * Creates a category.
 */
export const createCategoryCapability = defineCapability({
  name: "catalog.createCategory",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: categoryInputSchema,
  execute: (context: AdminContext, input) => {
    return categoriesRepository(context.client).insert(input, context.admin.id);
  },
});

/**
 * Replaces an active category's slug, name and position.
 */
export const updateCategoryCapability = defineCapability({
  name: "catalog.updateCategory",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: updateCategoryInputSchema,
  execute: (context: AdminContext, { id, ...fields }) => {
    return categoriesRepository(context.client).update(id, fields, context.admin.id);
  },
});

/**
 * Hides a category from the storefront.
 */
export const archiveCategoryCapability = defineCapability({
  name: "catalog.archiveCategory",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: recordIdInputSchema,
  execute: (context: AdminContext, { id }) => {
    return categoriesRepository(context.client).archive(id, context.admin.id);
  },
});
