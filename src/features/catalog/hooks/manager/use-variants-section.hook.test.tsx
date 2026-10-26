import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useVariantsSection } from "./use-variants-section.hook";
import { NEW_RECORD, RecordAction } from "../../domain/manager";
import { CatalogRecords } from "../../ui/testing/catalog-records.helper";

const unit = CatalogRecords.variant();
const gone = CatalogRecords.variant({ id: "variant-gone", archivedAt: "2026-10-01T00:00:00Z" });

describe("useVariantsSection", () => {
  it("lists only variants still sold, with the actions their buttons run", () => {
    const { result } = renderHook(() => useVariantsSection([unit, gone]));

    expect(result.current.activeVariants).toEqual([unit]);
    expect(result.current.archiveAction).toBe(RecordAction.ArchiveVariant);
    expect(result.current.setDefaultAction).toBe(RecordAction.SetDefaultVariant);
  });

  it("opens a variant or a new one in the editor, then closes it", () => {
    const { result } = renderHook(() => useVariantsSection([unit]));

    act(() => result.current.edit(unit.id));
    expect(result.current.editingVariant).toBe(unit);

    act(() => result.current.startCreate());
    expect(result.current).toMatchObject({ editingId: NEW_RECORD, editingVariant: null });

    act(() => result.current.closeEditor());
    expect(result.current.isEditorOpen).toBe(false);
  });

  it("blocks opening during product changes and confirms cancelling a dirty presentation", () => {
    const beforeEdit = vi.fn().mockReturnValue(false);
    const onSaved = vi.fn();
    const { result } = renderHook(() =>
      useVariantsSection([unit], {
        beforeEdit,
        isDirty: true,
        onSaved,
      }),
    );
    act(() => result.current.startCreate());
    expect(result.current.isEditorOpen).toBe(false);
    beforeEdit.mockReturnValue(true);
    act(() => result.current.startCreate());
    act(() => result.current.closeEditor());
    expect(result.current.isDiscardOpen).toBe(true);
    act(() => result.current.cancelDiscard());
    expect(result.current.isEditorOpen).toBe(true);
    act(() => result.current.saved());
    expect(result.current.isEditorOpen).toBe(false);
    expect(onSaved).toHaveBeenCalledOnce();
  });

  it("closes a dirty presentation on discard and reports it", () => {
    const onDiscard = vi.fn();
    const { result } = renderHook(() => useVariantsSection([unit], { isDirty: true, onDiscard }));
    act(() => result.current.startCreate());
    act(() => result.current.closeEditor());
    act(() => result.current.discardChanges());
    expect(result.current.isEditorOpen).toBe(false);
    expect(onDiscard).toHaveBeenCalledOnce();
  });
});
