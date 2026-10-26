"use client";

import { useState } from "react";

import { ManagerRecords, NEW_RECORD, RecordAction } from "../../domain/manager";
import type { Variant } from "../../index";

/**
 * State for a product's variants: which one is in the variant editor.
 * @param variants The product's variants, archived ones included.
 * @returns The variants still sold, the record actions their buttons run, and the variant
 * editor's state.
 */
export function useVariantsSection(variants: readonly Variant[]) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const activeVariants = variants.filter((variant) => ManagerRecords.isActive(variant));

  return {
    activeVariants,
    archiveAction: RecordAction.ArchiveVariant,
    setDefaultAction: RecordAction.SetDefaultVariant,
    isEditorOpen: editingId !== null,
    editingId,
    editingVariant: activeVariants.find((variant) => variant.id === editingId) ?? null,
    startCreate: () => setEditingId(NEW_RECORD),
    edit: setEditingId,
    closeEditor: () => setEditingId(null),
  };
}
