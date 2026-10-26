import "server-only";

import type { DatabaseClient } from "@/integrations/supabase/database-client.types";
import { Results, type Result } from "@/shared/lib/result";

import {
  STOCK_LEVEL_COLUMNS,
  STOCK_MOVEMENT_COLUMNS,
  stockLevelRowSchema,
  stockMovementRowSchema,
} from "./stock.schema";
import type { StockLevelDto, StockMovementDto } from "./stock.types";
import { InventoryError, type InventoryErrorCode } from "../../domain/errors";
import type { AdjustStockInput } from "../../domain/stock";
import { InventoryResults } from "../mutation";

/**
 * Stock reads and writes using the signed-in manager's RLS-scoped client.
 * @param client Authorized admin client.
 * @returns Parsed stock records and atomic adjustments.
 */
export function stockRepository(client: DatabaseClient) {
  return {
    adjust: (input: AdjustStockInput) => adjust(client, input),
    listLevels: () => listLevels(client),
    listMovements: (stockLevelId: string) => listMovements(client, stockLevelId),
  };
}

async function adjust(
  client: DatabaseClient,
  input: AdjustStockInput,
): Promise<Result<StockLevelDto, InventoryErrorCode>> {
  const response = await client.schema("inventory").rpc("adjust_stock", {
    p_variant_id: input.variantId,
    p_quantity: input.quantity,
    ...(input.pickupLocationId === null ? {} : { p_pickup_location_id: input.pickupLocationId }),
    ...(input.note === null ? {} : { p_note: input.note }),
  });

  return InventoryResults.fromResponse(
    response,
    stockLevelRowSchema,
    InventoryError.VariantNotStockTracked,
  );
}

async function listLevels(
  client: DatabaseClient,
): Promise<Result<StockLevelDto[], InventoryErrorCode>> {
  const { data, error } = await client
    .schema("inventory")
    .from("stock_levels")
    .select(STOCK_LEVEL_COLUMNS)
    .order("id");
  if (error) {
    throw error;
  }

  return Results.ok(data.map((row) => stockLevelRowSchema.parse(row)));
}

async function listMovements(
  client: DatabaseClient,
  stockLevelId: string,
): Promise<Result<StockMovementDto[], InventoryErrorCode>> {
  const { data, error } = await client
    .schema("inventory")
    .from("stock_movements")
    .select(STOCK_MOVEMENT_COLUMNS)
    .eq("stock_level_id", stockLevelId)
    .order("id", { ascending: false });
  if (error) {
    throw error;
  }

  return Results.ok(data.map((row) => stockMovementRowSchema.parse(row)));
}
