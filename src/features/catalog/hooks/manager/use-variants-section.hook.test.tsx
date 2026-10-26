import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
});
