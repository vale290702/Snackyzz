import "server-only";

import type { AdminContext } from "@/features/access";
import { CapabilityKind, defineCapability } from "@/shared/lib/capability";

import { brandsRepository } from "./brands.repository";
import { brandInputSchema, updateBrandInputSchema } from "../../domain/brands";
import { recordIdInputSchema } from "../../domain/fields";
import { CatalogImagePurpose, CatalogPermission, verifyCatalogImage } from "../mutation";

/**
 * Creates a brand. The very first brand becomes the primary one, since there must always be one.
 */
export const createBrandCapability = defineCapability({
  name: "catalog.createBrand",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: brandInputSchema,
  execute: async (context: AdminContext, input) => {
    const logo = await verifyCatalogImage(input.logoFileId, CatalogImagePurpose.BrandLogo);
    if (!logo.ok) {
      return logo;
    }

    const repository = brandsRepository(context.client);
    const isPrimary = !(await repository.hasPrimary());

    return repository.insert(input, context.admin.id, isPrimary);
  },
});

/**
 * Replaces an active brand's copy, logo, slug and position.
 */
export const updateBrandCapability = defineCapability({
  name: "catalog.updateBrand",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: updateBrandInputSchema,
  execute: async (context: AdminContext, { id, ...fields }) => {
    const logo = await verifyCatalogImage(fields.logoFileId, CatalogImagePurpose.BrandLogo);
    if (!logo.ok) {
      return logo;
    }

    return brandsRepository(context.client).update(id, fields, context.admin.id);
  },
});

/**
 * Hides a brand from the storefront. The primary brand must be replaced first.
 */
export const archiveBrandCapability = defineCapability({
  name: "catalog.archiveBrand",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: recordIdInputSchema,
  execute: (context: AdminContext, { id }) => {
    return brandsRepository(context.client).archive(id, context.admin.id);
  },
});

/**
 * Makes an active brand the primary one; the previous primary brand becomes a collab brand.
 */
export const setPrimaryBrandCapability = defineCapability({
  name: "catalog.setPrimaryBrand",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: recordIdInputSchema,
  execute: (context: AdminContext, { id }) => {
    return brandsRepository(context.client).setPrimary(id);
  },
});
