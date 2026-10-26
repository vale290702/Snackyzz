import { z } from "zod";

import { CategoryTextLimit } from "./categories.constants";
import { CatalogFields } from "../fields";

/**
 * A category's editable fields.
 */
export const categoryInputSchema = z.object({
  slug: CatalogFields.slug,
  name: CatalogFields.requiredText(CategoryTextLimit.Name),
  sortOrder: CatalogFields.sortOrder,
});

/**
 * A category's editable fields with the category they replace.
 */
export const updateCategoryInputSchema = categoryInputSchema.extend({ id: CatalogFields.id });
