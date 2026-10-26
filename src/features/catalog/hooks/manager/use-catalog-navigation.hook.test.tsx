import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useCatalogNavigation } from "./use-catalog-navigation.hook";
import { CatalogManagerView } from "../../domain/manager";

describe("useCatalogNavigation", () => {
  it("guards section changes, preserves cancellation and accepts explicit discard", () => {
    const { result } = renderHook(() => useCatalogNavigation());
    act(() => result.current.edit("product"));
    act(() => result.current.registerEditorChecks({ hasChanges: () => true, isBusy: () => false }));
    act(() => result.current.selectView(CatalogManagerView.Brands));
    expect(result.current.view).toBe(CatalogManagerView.Products);
    expect(result.current.isDiscardOpen).toBe(true);
    act(() => result.current.cancelDiscard());
    expect(result.current.editingId).toBe("product");
    act(() => result.current.selectView(CatalogManagerView.Categories));
    act(() => result.current.discardChanges());
    expect(result.current.view).toBe(CatalogManagerView.Categories);
    expect(result.current.editingId).toBeNull();
  });
});
