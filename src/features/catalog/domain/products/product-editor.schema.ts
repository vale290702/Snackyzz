import { productInputSchema } from "./products.schema";
import { CatalogFields } from "../fields";
import { variantFieldsInputSchema } from "../variants";

/**
 * Validates inline presentation fields only while the product has at most one presentation.
 * @param inline Whether presentation fields are included in this submission.
 * @returns The product editor's schema, without changing capability inputs.
 */
export function productEditorInputSchema(inline: boolean) {
  const fields = variantFieldsInputSchema.shape;
  return productInputSchema.extend({
    presentationName: inline ? fields.name : fields.name.optional(),
    price: inline ? fields.price : fields.price.optional(),
    sku: fields.sku,
    isStockTracked: fields.isStockTracked,
  });
}

/**
 * What the product editor saves in one submission: the product (a new one without `id`) and, while
 * it has at most one presentation, that presentation (a new one without `id`).
 */
export const saveProductInputSchema = productInputSchema.extend({
  id: CatalogFields.id.nullable().default(null),
  presentation: variantFieldsInputSchema
    .extend({ id: CatalogFields.id.nullable().default(null) })
    .nullable()
    .default(null),
});
