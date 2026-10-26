"use client";

import { useState } from "react";

import { ManagerRecords, NEW_RECORD, RecordAction } from "../../domain/manager";
import type { Variant } from "../../index";

/**
 * How the variants section works with the product editor around it.
 */
type VariantsSectionOptions = {
  beforeEdit?: (() => boolean) | undefined;
  isDirty?: boolean | undefined;
  onEditingChange?: ((open: boolean) => void) | undefined;
  onSaved?: (() => void) | undefined;
  onDiscard?: (() => void) | undefined;
};

/**
 * State for a product's variants: which one is in the variant editor.
 * @param variants The product's variants, archived ones included.
 * @param options
 * @returns The variants still sold, the record actions their buttons run, and the variant
 * editor's state.
 */
export function useVariantsSection(
  variants: readonly Variant[],
  options: VariantsSectionOptions = {},
) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);
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
    if (options.isDirty) {
      setIsDiscardOpen(true);
      return;
    }

    close();
  };

  const discardChanges = () => {
    setIsDiscardOpen(false);
    close();
    options.onDiscard?.();
  };

  const saved = () => {
    close();
    options.onSaved?.();
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
    saved,
  };
}
