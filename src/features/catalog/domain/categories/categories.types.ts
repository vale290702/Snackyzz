import type { z } from "zod";

import type { categoryInputSchema, updateCategoryInputSchema } from "./categories.schema";

/**
 * A validated new category.
 */
export type CategoryInput = z.output<typeof categoryInputSchema>;

/**
 * A validated category edit.
 */
export type UpdateCategoryInput = z.output<typeof updateCategoryInputSchema>;
