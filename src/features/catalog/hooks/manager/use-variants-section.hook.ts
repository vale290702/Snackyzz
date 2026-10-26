"use client";

import { useState } from "react";

import { ManagerRecords, NEW_RECORD, RecordAction } from "../../domain/manager";
import type { Variant } from "../../index";

/**
 * State for a product's variants: which one is in the variant editor.
 * @param variants The product's variants, archived ones included.
 * @param options
 * @returns The variants still sold, the record actions their buttons run, and the variant
 * editor's state.
 */
export function useVariantsSection(
  variants: readonly Variant[],
  options?: {
    beforeEdit?: (() => boolean) | undefined;
    hasChanges?: (() => boolean) | undefined;
    isBusy?: (() => boolean) | undefined;
    onEditingChange?: ((open: boolean) => void) | undefined;
    onSaved?: (() => void) | undefined;
  },
) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);

  const activeVariants = variants.filter((variant) => ManagerRecords.isActive(variant));

  function edit(id: string) {
    if (options?.beforeEdit && !options.beforeEdit()) return;
    setEditingId(id);
    options?.onEditingChange?.(true);
  }

  function closeEditor() {
    setEditingId(null);
    options?.onEditingChange?.(false);
  }

  return {
    activeVariants,
    archiveAction: RecordAction.ArchiveVariant,
    setDefaultAction: RecordAction.SetDefaultVariant,
    isEditorOpen: editingId !== null,
    editingId,
    editingVariant: activeVariants.find((variant) => variant.id === editingId) ?? null,
    startCreate: () => edit(NEW_RECORD),
    edit,
    closeEditor: () => {
      if (options?.isBusy?.()) return;
      if (options?.hasChanges?.()) setIsDiscardOpen(true);
      else closeEditor();
    },
    isDiscardOpen,
    cancelDiscard: () => setIsDiscardOpen(false),
    discardChanges: () => {
      if (options?.isBusy?.()) return;
      setIsDiscardOpen(false);
      closeEditor();
    },
    saved: () => {
      closeEditor();
      options?.onSaved?.();
    },
  };
}
