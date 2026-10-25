import type { z } from "zod";

import type { productInputSchema, updateProductInputSchema } from "./products.schema";

/**
 * A validated new product.
 */
export type ProductInput = z.output<typeof productInputSchema>;

/**
 * A validated product edit.
 */
export type UpdateProductInput = z.output<typeof updateProductInputSchema>;
