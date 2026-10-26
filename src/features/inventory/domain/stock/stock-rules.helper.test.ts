import { describe, expect, it } from "vitest";

import { StockRules } from "./stock-rules.helper";

const global = { id: "global", pickupLocationId: null, quantityAvailable: 4 };
const local = { id: "local", pickupLocationId: "location", quantityAvailable: 0 };

describe("StockRules", () => {
  it("skips stock for untracked variants", () => {
    expect(StockRules.resolve(false, [global, local], "location")).toBeNull();
  });

  it("selects location stock even when empty instead of falling back", () => {
    expect(StockRules.resolve(true, [global, local], "location")).toEqual(local);
  });

  it("uses global stock for delivery and locations without their own row", () => {
    expect(StockRules.resolve(true, [global, local])).toEqual(global);
    expect(StockRules.resolve(true, [global, local], "other")).toEqual(global);
  });

  it("returns null when a tracked variant has no pool", () => {
    expect(StockRules.resolve(true, [local])).toBeNull();
  });

  it("computes set-to adjustments without overwriting or emitting zero movements", () => {
    expect(StockRules.adjustmentDelta(4, 9)).toBe(5);
    expect(StockRules.adjustmentDelta(9, 4)).toBe(-5);
    expect(StockRules.adjustmentDelta(4, 4)).toBe(0);
  });
});
