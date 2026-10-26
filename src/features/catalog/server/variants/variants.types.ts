import type { z } from "zod";

import type { productDefaultRowSchema, variantRowSchema } from "./variants.schema";
import type { VariantInput } from "../../domain/variants";

/**
 * A variant as catalog management sees it, archived or not.
 */
export type Variant = z.output<typeof variantRowSchema>;

/**
 * Whether an active product already has its default variant.
 */
export type ProductDefault = z.output<typeof productDefaultRowSchema>;

/**
 * A variant's editable fields; its product never changes.
 */
export type VariantFields = Omit<VariantInput, "productId">;
