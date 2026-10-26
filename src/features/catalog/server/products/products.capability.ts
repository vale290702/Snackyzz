import "server-only";

import type { AdminContext } from "@/features/access";
import { CapabilityKind, defineCapability } from "@/shared/lib/capability";
import { Results } from "@/shared/lib/result";

import { productsRepository } from "./products.repository";
import { CatalogError } from "../../domain/errors";
import { recordIdInputSchema } from "../../domain/fields";
import {
  productInputSchema,
  saveProductInputSchema,
  updateProductInputSchema,
  type ProductInput,
  type UpdateProductInput,
} from "../../domain/products";
import { CatalogImagePurpose, CatalogPermission, verifyCatalogImage } from "../mutation";
import { VariantWrites } from "../variants/variants.capability";

/**
 * Checks the image and categories a product points at; the product row and its category links are
 * written in two requests, so they are checked first.
 * @param context The signed-in admin.
 * @param fields The product's image and categories.
 * @returns Nothing, or why the product can't use them.
 */
async function verifyProductReferences(
  context: AdminContext,
  fields: Pick<ProductInput, "imageFileId" | "categoryIds">,
) {
  const image = await verifyCatalogImage(fields.imageFileId, CatalogImagePurpose.ProductImage);
  if (!image.ok) {
    return image;
  }

  const canLink = await productsRepository(context.client).canLinkCategories(fields.categoryIds);

  return canLink ? Results.ok(null) : Results.err(CatalogError.CategoryNotFound);
}

/**
 * Product writes shared by the product capabilities.
 */
class ProductWrites {
  private constructor() {}

  /**
   * Creates a product after checking its image and categories.
   * @param context The signed-in admin.
   * @param input The parsed product.
   * @returns The product, or why it was not created.
   */
  static async create(context: AdminContext, input: ProductInput) {
    const references = await verifyProductReferences(context, input);
    if (!references.ok) {
      return references;
    }

    return productsRepository(context.client).insert(input, context.admin.id);
  }

  /**
   * Replaces a product after checking its image and categories.
   * @param context The signed-in admin.
   * @param input The parsed product with its id.
   * @returns The product, or why it was not updated.
   */
  static async update(context: AdminContext, { id, ...fields }: UpdateProductInput) {
    const references = await verifyProductReferences(context, fields);
    if (!references.ok) {
      return references;
    }

    return productsRepository(context.client).update(id, fields, context.admin.id);
  }
}

/**
 * Creates a product in a brand. It appears on the storefront once it has a variant.
 */
export const createProductCapability = defineCapability({
  name: "catalog.createProduct",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: productInputSchema,
  execute: (context: AdminContext, input) => ProductWrites.create(context, input),
});

/**
 * Replaces an active product's fields, image and categories.
 */
export const updateProductCapability = defineCapability({
  name: "catalog.updateProduct",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: updateProductInputSchema,
  execute: (context: AdminContext, input) => ProductWrites.update(context, input),
});

/**
 * Saves the product editor's submission: the product, then its only presentation. The two writes
 * are not one transaction, so a presentation failure still returns the saved product, and the
 * editor's retry updates it instead of creating another.
 */
export const saveProductCapability = defineCapability({
  name: "catalog.saveProduct",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: saveProductInputSchema,
  execute: async (context: AdminContext, { id, presentation, ...fields }) => {
    const product = id
      ? await ProductWrites.update(context, { ...fields, id })
      : await ProductWrites.create(context, fields);
    if (!product.ok) {
      return product;
    }
    if (!presentation) {
      return Results.ok({ product: product.value, presentationError: null });
    }

    const { id: presentationId, ...presentationFields } = presentation;
    const saved = presentationId
      ? await VariantWrites.update(context, { ...presentationFields, id: presentationId })
      : await VariantWrites.create(context, { ...presentationFields, productId: product.value.id });

    return Results.ok({ product: product.value, presentationError: saved.ok ? null : saved.error });
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
