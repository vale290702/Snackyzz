import type { z } from "zod";

import type { updateVariantInputSchema, variantInputSchema } from "./variants.schema";

/**
 * A validated new variant.
 */
export type VariantInput = z.output<typeof variantInputSchema>;

/**
 * A validated variant edit.
 */
export type UpdateVariantInput = z.output<typeof updateVariantInputSchema>;
