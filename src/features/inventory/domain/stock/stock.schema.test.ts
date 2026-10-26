import { describe, expect, it } from "vitest";

import { adjustStockInputSchema } from "./stock.schema";

const variantId = "00000000-0000-7000-8000-000000000001";

describe("adjustStockInputSchema", () => {
  it("parses a form quantity and defaults to the global pool", () => {
    expect(
      adjustStockInputSchema.parse({ variantId, quantity: "12", note: "  Recuento  " }),
    ).toEqual({
      variantId,
      quantity: 12,
      pickupLocationId: null,
      note: "Recuento",
    });
  });

  it("rejects missing, blank, null, negative, fractional and overflowing quantities", () => {
    for (const quantity of [undefined, "", " ", null, false, -1, 1.5, 2147483648]) {
      const result = adjustStockInputSchema.safeParse({ variantId, quantity });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("quantity_invalid");
      }
    }
  });

  it("accepts zero and the postgres integer maximum", () => {
    for (const quantity of [0, 2147483647]) {
      expect(adjustStockInputSchema.parse({ variantId, quantity }).quantity).toBe(quantity);
    }
  });

  it("reports field codes for references and long notes", () => {
    for (const input of [
      { variantId: "bad", quantity: 1 },
      { variantId, quantity: 1, pickupLocationId: "bad" },
    ]) {
      expect(adjustStockInputSchema.safeParse(input).error?.issues[0]?.message).toBe(
        "reference_invalid",
      );
    }
    expect(
      adjustStockInputSchema.safeParse({ variantId, quantity: 1, note: "x".repeat(501) }).error
        ?.issues[0]?.message,
    ).toBe("note_too_long");
  });
});
