import { z } from "zod";

import { VariantTextLimit } from "./variants.constants";
import { CatalogFields } from "../fields";

const variantFields = {
  sku: CatalogFields.optionalText(VariantTextLimit.Sku),
  name: CatalogFields.requiredText(VariantTextLimit.Name),
  price: CatalogFields.price,
  isStockTracked: z.boolean().default(true),
  sortOrder: CatalogFields.sortOrder,
};

/**
 * A new way to sell a product. The product's first variant becomes its default.
 */
export const variantInputSchema = z.object({
  productId: CatalogFields.id,
  ...variantFields,
});

/**
 * A variant's editable fields with the variant they replace; it stays on its product.
 */
export const updateVariantInputSchema = z.object({
  id: CatalogFields.id,
  ...variantFields,
});
