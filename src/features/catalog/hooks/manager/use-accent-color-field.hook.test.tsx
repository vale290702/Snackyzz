import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAccentColorField } from "./use-accent-color-field.hook";

describe("useAccentColorField", () => {
  it("keeps the native picker on a valid color while the hex is half typed", () => {
    const { result, rerender } = renderHook((color: string) => useAccentColorField(color), {
      initialProps: "#12",
    });
    expect(result.current.pickerColor).not.toBe("#12");

    rerender("#123456");
    expect(result.current.pickerColor).toBe("#123456");
    expect(result.current.swatchValue).toBe("");
  });

  it("matches a palette swatch regardless of case", () => {
    const { result } = renderHook(() => useAccentColorField("#3c1907"));

    expect(result.current.swatchValue).toBe("#3C1907");
  });
});
