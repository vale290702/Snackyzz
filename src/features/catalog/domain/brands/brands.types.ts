import type { z } from "zod";

import type { brandInputSchema, updateBrandInputSchema } from "./brands.schema";

/**
 * A validated new brand.
 */
export type BrandInput = z.output<typeof brandInputSchema>;

/**
 * A validated brand edit.
 */
export type UpdateBrandInput = z.output<typeof updateBrandInputSchema>;
