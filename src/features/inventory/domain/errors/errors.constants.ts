/**
 * Expected stock failures returned by inventory operations.
 */
export const InventoryError = {
  VariantNotStockTracked: "variant_not_stock_tracked",
  PickupLocationNotFound: "pickup_location_not_found",
  InsufficientStock: "insufficient_stock",
} as const;

/**
 * Inventory's expected action failures.
 */
export type InventoryErrorCode = (typeof InventoryError)[keyof typeof InventoryError];
