import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useCatalogEditor } from "./use-catalog-editor.hook";

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

function renderEditor(isDirty: boolean) {
  const options = { isDirty, markClean: vi.fn(), onSaved: vi.fn(), savedMessage: "Guardado" };

  return { options, ...renderHook(() => useCatalogEditor(options)) };
}

describe("useCatalogEditor", () => {
  it("asks to save the product before editing a presentation over unsaved changes", () => {
    const { result } = renderEditor(true);

    let canEdit = true;
    act(() => {
      canEdit = result.current.beforePresentationEdit();
    });

    expect(canEdit).toBe(false);
    expect(result.current.needsSave).toBe(true);
  });

  it("lets a clean product open its presentations", () => {
    const { result } = renderEditor(false);

    let canEdit = false;
    act(() => {
      canEdit = result.current.beforePresentationEdit();
    });

    expect(canEdit).toBe(true);
    expect(result.current.needsSave).toBe(false);
  });

  it("closes after a record save and stays open, clean, after a presentation save", () => {
    const { result, options } = renderEditor(true);

    act(() => result.current.presentationSaved());
    expect(options.markClean).toHaveBeenCalledOnce();
    expect(options.onSaved).not.toHaveBeenCalled();

    act(() => result.current.saved());
    expect(options.onSaved).toHaveBeenCalledOnce();
  });
});
