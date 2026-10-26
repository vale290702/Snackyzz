import type { z } from "zod";

import type { adjustStockInputSchema } from "./stock.schema";

/**
 * Validated set-to stock adjustment.
 */
export type AdjustStockInput = z.infer<typeof adjustStockInputSchema>;
