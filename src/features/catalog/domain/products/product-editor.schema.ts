import { productInputSchema } from "./products.schema";
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
