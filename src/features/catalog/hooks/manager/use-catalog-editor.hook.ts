"use client";

import { useState } from "react";
import { toast } from "sonner";

/**
 * Inputs for the editor's save feedback and presentation editing.
 */
type CatalogEditorOptions = {
  isRecordDirty: boolean;
  onSaved: () => void;
  savedMessage: string;
};

/**
 * Confirms saves and keeps presentation editing from starting over unsaved product changes.
 * @param options Whether the product form has unsaved changes, what a product save does next, and
 * the translated confirmation.
 * @returns Presentation editing state and the save handlers.
 */
export function useCatalogEditor({ isRecordDirty, onSaved, savedMessage }: CatalogEditorOptions) {
  const [needsSave, setNeedsSave] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  const beforePresentationEdit = () => {
    setNeedsSave(isRecordDirty);
    return !isRecordDirty;
  };

  const saved = () => {
    toast.success(savedMessage);
    onSaved();
  };

  return {
    needsSave,
    isPresentationOpen,
    setIsPresentationOpen,
    beforePresentationEdit,
    saved,
    presentationSaved: () => toast.success(savedMessage),
  };
}
