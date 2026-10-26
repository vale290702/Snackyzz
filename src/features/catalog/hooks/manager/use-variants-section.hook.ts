"use client";

import { useState } from "react";

import { ManagerRecords, NEW_RECORD, RecordAction } from "../../domain/manager";
import type { Variant } from "../../index";

/**
 * How the variants section works with the product editor around it.
 */
type VariantsSectionOptions = {
  beforeEdit?: (() => boolean) | undefined;
  onEditingChange?: ((open: boolean) => void) | undefined;
  onSaved?: (() => void) | undefined;
  onDirtyChange?: ((isDirty: boolean) => void) | undefined;
};

/**
 * Whether the open presentation form has unsaved changes, also passed on to the product editor.
 * @param onDirtyChange The product editor's callback, if any.
 * @returns The dirty flag and the form's report handler.
 */
function usePresentationDirty(onDirtyChange: ((isDirty: boolean) => void) | undefined) {
  const [isDirty, setIsDirty] = useState(false);

  const dirtyChanged = (dirty: boolean) => {
    setIsDirty(dirty);
    onDirtyChange?.(dirty);
  };

  return { isDirty, dirtyChanged };
}

/**
 * State for a product's variants: which one is in the variant editor.
 * @param variants The product's variants, archived ones included.
 * @param options How the product editor gates, tracks and confirms presentation editing.
 * @returns The variants still sold, the record actions their buttons run, and the variant
 * editor's state.
 */
export function useVariantsSection(
  variants: readonly Variant[],
  options: VariantsSectionOptions = {},
) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
  const { isDirty, dirtyChanged } = usePresentationDirty(options.onDirtyChange);
  const activeVariants = variants.filter((variant) => ManagerRecords.isActive(variant));

  const edit = (id: string) => {
    if (options.beforeEdit && !options.beforeEdit()) {
      return;
    }

    setEditingId(id);
    options.onEditingChange?.(true);
  };

  const close = () => {
    setEditingId(null);
    options.onEditingChange?.(false);
  };

  const closeEditor = () => {
    if (isDirty) {
      setIsDiscardOpen(true);
      return;
    }

    close();
  };

  const discardChanges = () => {
    setIsDiscardOpen(false);
    close();
  };

  return {
    activeVariants,
    archiveAction: RecordAction.ArchiveVariant,
    setDefaultAction: RecordAction.SetDefaultVariant,
    isEditorOpen: editingId !== null,
    editingId,
    editingVariant: activeVariants.find((variant) => variant.id === editingId) ?? null,
    startCreate: () => edit(NEW_RECORD),
    edit,
    closeEditor,
    isDiscardOpen,
    cancelDiscard: () => setIsDiscardOpen(false),
    discardChanges,
    dirtyChanged,
    saved: () => {
      close();
      options.onSaved?.();
    },
  };
}
