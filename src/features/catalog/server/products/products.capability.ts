import "server-only";

import type { AdminContext } from "@/features/access";
import { CapabilityKind, defineCapability } from "@/shared/lib/capability";
import { Results } from "@/shared/lib/result";

import { productsRepository } from "./products.repository";
import { CatalogError } from "../../domain/errors";
import { recordIdInputSchema } from "../../domain/fields";
import { productInputSchema, updateProductInputSchema } from "../../domain/products";
import { CatalogImagePurpose, CatalogPermission, verifyCatalogImage } from "../mutation";

/**
 * Creates a product in a brand. It appears on the storefront once it has a variant. Categories are
 * checked first, because the product row and its links are written in two requests.
 */
export const createProductCapability = defineCapability({
  name: "catalog.createProduct",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: productInputSchema,
  execute: async (context: AdminContext, input) => {
    const image = await verifyCatalogImage(input.imageFileId, CatalogImagePurpose.ProductImage);
    if (!image.ok) {
      return image;
    }

    const repository = productsRepository(context.client);
    if (!(await repository.canLinkCategories(input.categoryIds))) {
      return Results.err(CatalogError.CategoryNotFound);
    }

    return repository.insert(input, context.admin.id);
  },
});

/**
 * Replaces an active product's fields, image and categories.
 */
export const updateProductCapability = defineCapability({
  name: "catalog.updateProduct",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: updateProductInputSchema,
  execute: async (context: AdminContext, { id, ...fields }) => {
    const image = await verifyCatalogImage(fields.imageFileId, CatalogImagePurpose.ProductImage);
    if (!image.ok) {
      return image;
    }

    const repository = productsRepository(context.client);
    if (!(await repository.canLinkCategories(fields.categoryIds))) {
      return Results.err(CatalogError.CategoryNotFound);
    }

    return repository.update(id, fields, context.admin.id);
  },
});

/**
 * Hides a product and its variants from the storefront.
 */
export const archiveProductCapability = defineCapability({
  name: "catalog.archiveProduct",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: recordIdInputSchema,
  execute: (context: AdminContext, { id }) => {
    return productsRepository(context.client).archive(id, context.admin.id);
  },
});
