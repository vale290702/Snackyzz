import { describe, expect, it } from "vitest";

import { InventoryResults } from "./database-result.helper";
import { InventoryError } from "../../domain/errors";

describe("InventoryResults", () => {
  it("maps entry-point failures without exposing SQL messages", () => {
    expect(
      InventoryResults.fromError({ code: "P0001", message: "variant_not_stock_tracked" }),
    ).toEqual({
      ok: false,
      error: InventoryError.VariantNotStockTracked,
    });
    expect(
      InventoryResults.fromError({ code: "P0001", message: "pickup_location_not_found" }),
    ).toEqual({
      ok: false,
      error: InventoryError.PickupLocationNotFound,
    });
  });

  it("maps the stock floor constraint while rethrowing other database failures", () => {
    expect(
      InventoryResults.fromError({
        code: "23514",
        message: 'violates check constraint "stock_levels_quantity_available_check"',
      }),
    ).toEqual({
      ok: false,
      error: InventoryError.InsufficientStock,
    });
    expect(() =>
      InventoryResults.fromError({ code: "42501", message: "permission denied" }),
    ).toThrow();
    expect(() =>
      InventoryResults.fromError({ code: "23514", message: 'violates check constraint "unknown"' }),
    ).toThrow();
  });
});
