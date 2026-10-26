"use client";

import { useRef, useState } from "react";

import type { CatalogEditorState, CatalogNavigationTarget } from "./catalog-editor.types";
import { CatalogManagerView, NEW_RECORD } from "../../domain/manager";

/**
 * Guards catalog navigation against dirty forms and in-flight writes.
 * @returns The current record, pending navigation and explicit accept/cancel handlers.
 */
export function useCatalogNavigation() {
  const [target, setTarget] = useState<CatalogNavigationTarget>({
    view: CatalogManagerView.Products,
    editingId: null,
  });
  const [pending, setPending] = useState<CatalogNavigationTarget | null>(null);
  const editorState = useRef<CatalogEditorState>({ hasChanges: () => false, isBusy: () => false });
  const opener = useRef<HTMLElement | null>(null);

  function navigate(next: CatalogNavigationTarget) {
    if (target.editingId !== null && editorState.current.isBusy()) return;
    if (target.editingId !== null && editorState.current.hasChanges()) {
      setPending(next);
      return;
    }
    if (target.editingId === null && document.activeElement instanceof HTMLElement) {
      opener.current = document.activeElement;
    }
    setTarget(next);
  }

  return {
    ...target,
    editorState,
    registerEditorChecks: (checks: CatalogEditorState) => {
      editorState.current = checks;
    },
    opener,
    isDiscardOpen: pending !== null,
    cancelDiscard: () => setPending(null),
    discardChanges: () => {
      if (pending && !editorState.current.isBusy()) setTarget(pending);
      setPending(null);
    },
    selectView: (view: CatalogNavigationTarget["view"]) => navigate({ view, editingId: null }),
    edit: (editingId: string) => navigate({ ...target, editingId }),
    startCreate: () => navigate({ ...target, editingId: NEW_RECORD }),
    closeEditor: () => navigate({ ...target, editingId: null }),
    saved: () => setTarget({ ...target, editingId: null }),
    restoreFocus: (event: Event) => {
      event.preventDefault();
      opener.current?.focus({ preventScroll: true });
    },
    focusTitle: (event: Event) => {
      event.preventDefault();
      document.getElementById("catalog-editor-title")?.focus({ preventScroll: true });
    },
  };
}
