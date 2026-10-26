import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAccentColorField } from "./use-accent-color-field.hook";

describe("useAccentColorField", () => {
  it("keeps typed custom hex text while the native picker retains a valid color", () => {
    const { result } = renderHook(() => useAccentColorField("#ED781A"));
    act(() => result.current.setColor("#12"));
    expect(result.current.color).toBe("#12");
    expect(result.current.pickerColor).toBe("#ED781A");
    act(() => result.current.setColor("#123456"));
    expect(result.current.pickerColor).toBe("#123456");
  });
});
