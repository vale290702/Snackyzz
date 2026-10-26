import { describe, expect, it } from "vitest";

import { VariantSelection } from "./variant-selection.helper";

const single = { id: "unit", isDefault: true };
const box = { id: "box", isDefault: false };

describe("VariantSelection", () => {
  it("summarizes the actual minimum independently of the default", () => {
    expect(
      VariantSelection.summary([
        { ...single, price: 5000 },
        { ...box, price: 1200 },
      ]),
    ).toEqual({ minimumPrice: 1200, count: 2, hasChoice: true });
    expect(VariantSelection.summary([])).toEqual({
      minimumPrice: null,
      count: 0,
      hasChoice: false,
    });
  });
  it("shows the default variant first, else the first one", () => {
    expect(VariantSelection.defaultOf([box, single])).toBe(single);
    expect(VariantSelection.defaultOf([box])).toBe(box);
    expect(VariantSelection.defaultOf([])).toBeNull();
  });

  it("keeps a chosen variant and falls back to the default when it is gone", () => {
    expect(VariantSelection.chosen([single, box], "box")).toBe(box);
    expect(VariantSelection.chosen([single, box], "archived")).toBe(single);
    expect(VariantSelection.chosen([single, box], null)).toBe(single);
  });

  it("offers a choice only with two or more variants", () => {
    expect(VariantSelection.hasChoice([single])).toBe(false);
    expect(VariantSelection.hasChoice([single, box])).toBe(true);
  });
});
