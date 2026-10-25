import { z } from "zod";

import { MAX_PRODUCT_CATEGORIES, ProductTextLimit } from "./products.constants";
import { CatalogFieldError, CatalogFields } from "../fields";

/**
 * A product's editable fields, including the full set of categories it belongs to.
 */
export const productInputSchema = z.object({
  brandId: CatalogFields.id,
  slug: CatalogFields.slug,
  name: CatalogFields.requiredText(ProductTextLimit.Name),
  description: CatalogFields.requiredText(ProductTextLimit.Description),
  badge: CatalogFields.optionalText(ProductTextLimit.Badge),
  accentColor: CatalogFields.accentColor,
  imageFileId: CatalogFields.fileId,
  sortOrder: CatalogFields.sortOrder,
  categoryIds: z
    .array(CatalogFields.id, { error: CatalogFieldError.ReferenceInvalid })
    .max(MAX_PRODUCT_CATEGORIES, { error: CatalogFieldError.TooLong })
    .default([])
    .transform((categoryIds) => [...new Set(categoryIds)]),
});

/**
 * A product's editable fields with the product they replace.
 */
export const updateProductInputSchema = productInputSchema.extend({ id: CatalogFields.id });
