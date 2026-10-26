import "server-only";

import type { AdminContext } from "@/features/access";
import { CapabilityKind, defineCapability } from "@/shared/lib/capability";

import { variantsRepository } from "./variants.repository";
import { recordIdInputSchema } from "../../domain/fields";
import {
  updateVariantInputSchema,
  variantInputSchema,
  type UpdateVariantInput,
  type VariantInput,
} from "../../domain/variants";
import { CatalogPermission } from "../mutation";

/**
 * Variant writes shared by the variant capabilities and the product editor's save.
 */
export class VariantWrites {
  private constructor() {}

  /**
   * Adds a variant; the product's first one becomes its default.
   * @param context The signed-in admin.
   * @param input The parsed variant with its product.
   * @returns The variant, or why it was not added.
   */
  static async create(context: AdminContext, input: VariantInput) {
    const repository = variantsRepository(context.client);

    const product = await repository.findProductDefault(input.productId);
    if (!product.ok) {
      return product;
    }

    return repository.insert(input, context.admin.id, !product.value.hasDefault);
  }

  /**
   * Replaces an active variant's fields.
   * @param context The signed-in admin.
   * @param input The parsed variant with its id.
   * @returns The variant, or why it was not updated.
   */
  static update(context: AdminContext, { id, ...fields }: UpdateVariantInput) {
    return variantsRepository(context.client).update(id, fields, context.admin.id);
  }
}

/**
 * Adds a way to sell an active product. Its first variant becomes the default, so every product
 * on sale has exactly one.
 */
export const createVariantCapability = defineCapability({
  name: "catalog.createVariant",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: variantInputSchema,
  execute: (context: AdminContext, input) => VariantWrites.create(context, input),
});

/**
 * Replaces an active variant's SKU, name, price, stock tracking and position.
 */
export const updateVariantCapability = defineCapability({
  name: "catalog.updateVariant",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: updateVariantInputSchema,
  execute: (context: AdminContext, input) => VariantWrites.update(context, input),
});

/**
 * Stops selling a variant. The default variant must be replaced first.
 */
export const archiveVariantCapability = defineCapability({
  name: "catalog.archiveVariant",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: recordIdInputSchema,
  execute: (context: AdminContext, { id }) => {
    return variantsRepository(context.client).archive(id, context.admin.id);
  },
});

/**
 * Makes an active variant its product's default.
 */
export const setDefaultVariantCapability = defineCapability({
  name: "catalog.setDefaultVariant",
  kind: CapabilityKind.Mutation,
  permission: CatalogPermission.Manage,
  input: recordIdInputSchema,
  execute: (context: AdminContext, { id }) => {
    return variantsRepository(context.client).setDefault(id);
  },
});
