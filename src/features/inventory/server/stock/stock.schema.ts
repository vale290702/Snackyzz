import { z } from "zod";

import { Constants } from "@/integrations/supabase/database.types";

/**
 * Database stock pool parsed into the public admin record.
 */
export const stockLevelRowSchema = z
  .object({
    id: z.uuid(),
    variant_id: z.uuid(),
    pickup_location_id: z.uuid().nullable(),
    quantity_available: z.number().int().nonnegative(),
    updated_at: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    variantId: row.variant_id,
    quantityAvailable: row.quantity_available,
    scope:
      row.pickup_location_id === null
        ? ("global" as const)
        : { pickupLocationId: row.pickup_location_id },
    updatedAt: row.updated_at,
  }));

/**
 * Immutable ledger record, including the responsible admin when present.
 */
export const stockMovementRowSchema = z
  .object({
    id: z.uuid(),
    stock_level_id: z.uuid(),
    quantity_delta: z.number().int(),
    reason: z.enum(Constants.inventory.Enums.movement_reason),
    note: z.string().nullable(),
    created_by: z.uuid().nullable(),
    created_at: z.string(),
  })
  .transform((row) => ({
    id: row.id,
    stockLevelId: row.stock_level_id,
    quantityDelta: row.quantity_delta,
    reason: row.reason,
    note: row.note,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }));

/**
 * Explicit columns prevent accidentally exposing future stock metadata.
 */
export const STOCK_LEVEL_COLUMNS = "id,variant_id,pickup_location_id,quantity_available,updated_at";

/**
 * The immutable ledger columns available to inventory managers.
 */
export const STOCK_MOVEMENT_COLUMNS =
  "id,stock_level_id,quantity_delta,reason,note,created_by,created_at";
