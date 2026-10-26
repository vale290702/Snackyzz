"use client";

import { useState } from "react";
import { toast } from "sonner";

/**
 * Inputs for the editor's save feedback and presentation editing.
 */
type CatalogEditorOptions = {
  isDirty: boolean;
  markClean: () => void;
  onSaved: () => void;
  savedMessage: string;
};

/**
 * Confirms saves and keeps presentation editing from starting over unsaved product changes.
 * @param options Whether the editor has unsaved changes, how to clear that, what a product save
 * does next, and the translated confirmation.
 * @returns Presentation editing state and the save handlers.
 */
export function useCatalogEditor({
  isDirty,
  markClean,
  onSaved,
  savedMessage,
}: CatalogEditorOptions) {
  const [needsSave, setNeedsSave] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  const beforePresentationEdit = () => {
    setNeedsSave(isDirty);

    return !isDirty;
  };

  const saved = () => {
    toast.success(savedMessage);
    onSaved();
  };

  const presentationSaved = () => {
    toast.success(savedMessage);
    markClean();
  };

  return {
    needsSave,
    isPresentationOpen,
    setIsPresentationOpen,
    beforePresentationEdit,
    saved,
    presentationSaved,
  };
}
