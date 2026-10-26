import { describe, expect, it } from "vitest";

import { VariantSelection } from "./variant-selection.helper";

const single = { id: "unit", isDefault: true };
const box = { id: "box", isDefault: false };

describe("VariantSelection", () => {
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
