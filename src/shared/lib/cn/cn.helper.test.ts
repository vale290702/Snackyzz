import { describe, expect, it } from "vitest";

import { cn } from ".";

describe("cn", () => {
  it("lets a later utility override an earlier one", () => {
    expect(cn("px-2 text-sm", "px-4")).toBe("text-sm px-4");
  });

  it("treats brand radius and shadow tokens as their own scales", () => {
    expect(cn("rounded-control", "rounded-full")).toBe("rounded-full");
    expect(cn("shadow-float", "shadow-none")).toBe("shadow-none");
  });

  it("keeps the display font size next to a text color", () => {
    expect(cn("text-display", "text-chocolate")).toBe("text-display text-chocolate");
  });
});
