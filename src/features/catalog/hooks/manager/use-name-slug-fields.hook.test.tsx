import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { describe, expect, it, vi } from "vitest";

import { useNameSlugFields } from "./use-name-slug-fields.hook";

function typed(value: string) {
  return { target: { value } } as ChangeEvent<HTMLInputElement>;
}

describe("useNameSlugFields", () => {
  it("generates new slugs until explicitly edited", () => {
    const setSlug = vi.fn();
    const { result } = renderHook(() => useNameSlugFields({ initialSlug: "", setSlug }));

    act(() => result.current.nameChanged(typed("Limón")));
    expect(setSlug).toHaveBeenLastCalledWith("limon");

    act(() => result.current.editSlug());
    act(() => result.current.nameChanged(typed("Café")));
    expect(setSlug).toHaveBeenCalledOnce();
    expect(result.current.isEditingSlug).toBe(true);
  });

  it("keeps an existing slug when its name changes", () => {
    const setSlug = vi.fn();
    const { result } = renderHook(() => useNameSlugFields({ initialSlug: "existing", setSlug }));

    act(() => result.current.nameChanged(typed("New")));

    expect(setSlug).not.toHaveBeenCalled();
  });
});
