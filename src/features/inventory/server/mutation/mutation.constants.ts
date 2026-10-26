import type { Permission } from "@/features/access";

import { InventoryError, type InventoryErrorCode } from "../../domain/errors";

/**
 * Permission required by every inventory admin operation.
 */
export const InventoryPermission = { Manage: "inventory.manage" } as const satisfies Record<
  string,
  Permission
>;

/**
 * Every stock change expires cached availability.
 */
export const INVENTORY_CACHE_TAG = "inventory";

/**
 * Catalog publication and stock tracking affect availability too.
 */
export const CATALOG_CACHE_TAG = "catalog";

/**
 * SQLSTATE values for inventory's expected failures.
 */
export const PostgresErrorCode = {
  RaisedException: "P0001",
  UniqueViolation: "23505",
  CheckViolation: "23514",
} as const;

/**
 * Expected exceptions raised by inventory entry points.
 */
export const DATABASE_FAILURES: Readonly<Record<string, InventoryErrorCode>> = {
  stock_levels_quantity_available_check: InventoryError.InsufficientStock,
  variant_not_stock_tracked: InventoryError.VariantNotStockTracked,
  pickup_location_not_found: InventoryError.PickupLocationNotFound,
};
