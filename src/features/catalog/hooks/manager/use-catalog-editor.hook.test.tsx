import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import type { CatalogEditorState } from "./catalog-editor.types";
import { useCatalogEditor } from "./use-catalog-editor.hook";

vi.mock("@/shared/ui/sonner", () => ({ toast: { success: vi.fn() } }));

describe("useCatalogEditor", () => {
  it("compares current form values, including hidden selections, and ignores reverted edits", () => {
    const editorState = createRef<CatalogEditorState>();
    const container = document.createElement("div");
    container.innerHTML =
      '<form><input name="name" value="Cookie"><input name="imageFileId" type="hidden" value="old"></form>';
    const { result, rerender } = renderHook(() =>
      useCatalogEditor({
        registerChecks: (checks) => {
          editorState.current = checks;
        },
        onSaved: vi.fn(),
        savedMessage: "Saved",
      }),
    );
    act(() => result.current.attachBody(container));
    act(() => result.current.rememberForms());
    const input = container.querySelector("input") as HTMLInputElement;
    input.value = "Edited";
    expect(editorState.current?.hasChanges()).toBe(true);
    input.value = "Cookie";
    expect(editorState.current?.hasChanges()).toBe(false);
    const hidden = container.querySelector('[type="hidden"]') as HTMLInputElement;
    hidden.value = "new";
    expect(editorState.current?.hasChanges()).toBe(true);
    expect(result.current.beforePresentationEdit()).toBe(false);
    rerender();
  });

  it("blocks navigation during a save or upload and protects browser unload", () => {
    const editorState = createRef<CatalogEditorState>();
    const container = document.createElement("div");
    container.innerHTML = '<form aria-busy="true"><input name="name" value="Cookie"></form>';
    const { result } = renderHook(() =>
      useCatalogEditor({
        registerChecks: (checks) => {
          editorState.current = checks;
        },
        onSaved: vi.fn(),
        savedMessage: "Saved",
      }),
    );
    act(() => result.current.attachBody(container));
    act(() => result.current.rememberForms());
    expect(editorState.current?.isBusy()).toBe(true);
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
