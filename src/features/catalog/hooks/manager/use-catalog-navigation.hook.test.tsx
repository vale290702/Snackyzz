import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useCatalogNavigation } from "./use-catalog-navigation.hook";
import { CatalogManagerView } from "../../domain/manager";

describe("useCatalogNavigation", () => {
  it("asks before leaving unsaved changes, keeps them on cancel and leaves on discard", () => {
    const { result } = renderHook(() => useCatalogNavigation());

    act(() => result.current.edit("product"));
    act(() => result.current.markDirty());
    act(() => result.current.selectView(CatalogManagerView.Brands));

    expect(result.current).toMatchObject({
      view: CatalogManagerView.Products,
      isDiscardOpen: true,
    });

    act(() => result.current.cancelDiscard());
    expect(result.current).toMatchObject({ editingId: "product", isDirty: true });

    act(() => result.current.selectView(CatalogManagerView.Categories));
    act(() => result.current.discardChanges());

    expect(result.current).toMatchObject({
      view: CatalogManagerView.Categories,
      editingId: null,
      isDirty: false,
    });
  });

  it("closes a saved record without asking", () => {
    const { result } = renderHook(() => useCatalogNavigation());

    act(() => result.current.edit("product"));
    act(() => result.current.markDirty());
    act(() => result.current.saved());

    expect(result.current).toMatchObject({ editingId: null, isDirty: false, isDiscardOpen: false });
  });
});
