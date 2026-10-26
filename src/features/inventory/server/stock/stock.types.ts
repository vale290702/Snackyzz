import type { z } from "zod";

import type { Database } from "@/integrations/supabase/database-client.types";

import type { stockLevelRowSchema, stockMovementRowSchema } from "./stock.schema";

/**
 * Inventory manager's stock pool record.
 */
export type StockLevelDto = z.infer<typeof stockLevelRowSchema>;

/**
 * An immutable stock change.
 */
export type StockMovementDto = z.infer<typeof stockMovementRowSchema>;

/**
 * Closed database set of ledger reasons.
 */
export type MovementReason = Database["inventory"]["Enums"]["movement_reason"];
