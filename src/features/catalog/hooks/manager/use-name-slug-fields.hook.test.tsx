import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useNameSlugFields } from "./use-name-slug-fields.hook";

describe("useNameSlugFields", () => {
  it("generates new slugs until explicitly edited", () => {
    const { result } = renderHook(() => useNameSlugFields("", ""));
    act(() => result.current.changeName("Limón"));
    expect(result.current.slug).toBe("limon");
    act(() => {
      result.current.editSlug();
      result.current.setSlug("special");
    });
    act(() => result.current.changeName("Café"));
    expect(result.current.slug).toBe("special");
  });
  it("keeps an existing slug when its name changes", () => {
    const { result } = renderHook(() => useNameSlugFields("Old", "existing"));
    act(() => result.current.changeName("New"));
    expect(result.current.slug).toBe("existing");
  });
});
