"use client";

import { useEffect, useRef, useState } from "react";

import type { CatalogNavigationTarget, EditorFormValue } from "./catalog-editor.types";
import { CatalogManagerView, NEW_RECORD } from "../../domain/manager";

/**
 * Asks the browser to confirm closing or reloading the tab while there are unsaved changes.
 * @param isDirty Whether the editor has unsaved changes.
 */
function useWarnBeforeLeaving(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) {
      return;
    }

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);

    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);
}

/**
 * Which of the editor's forms have unsaved changes.
 * @returns Whether any form is dirty, a per-form check, the report handler and a reset.
 */
function useDirtyForms() {
  const [forms, setForms] = useState<ReadonlySet<EditorFormValue>>(new Set());

  const report = (form: EditorFormValue, isDirty: boolean) => {
    setForms((current) => {
      if (current.has(form) === isDirty) {
        return current;
      }

      const next = new Set(current);
      if (isDirty) {
        next.add(form);
      } else {
        next.delete(form);
      }

      return next;
    });
  };

  return {
    isDirty: forms.size > 0,
    isFormDirty: (form: EditorFormValue) => forms.has(form),
    report,
    clear: () => setForms(new Set()),
  };
}

/**
 * Which section and record are open, guarded so unsaved editor changes are never lost silently.
 * @returns The open section and record, which forms have unsaved changes, the pending discard
 * question, and the navigation and focus handlers.
 */
export function useCatalogNavigation() {
  const [target, setTarget] = useState<CatalogNavigationTarget>({
    view: CatalogManagerView.Products,
    editingId: null,
  });
  const [pending, setPending] = useState<CatalogNavigationTarget | null>(null);
  const dirty = useDirtyForms();
  const { isDirty } = dirty;
  // The sheet has no Radix trigger to return focus to, so remember what opened it.
  const opener = useRef<HTMLElement | null>(null);

  useWarnBeforeLeaving(isDirty);

  const go = (next: CatalogNavigationTarget) => {
    if (target.editingId === null && document.activeElement instanceof HTMLElement) {
      opener.current = document.activeElement;
    }

    setTarget(next);
    dirty.clear();
    setPending(null);
  };

  const navigate = (next: CatalogNavigationTarget) => {
    if (target.editingId !== null && isDirty) {
      setPending(next);
      return;
    }

    go(next);
  };

  const discardChanges = () => {
    if (pending) {
      go(pending);
    }
  };

  const restoreFocus = (event: Event) => {
    event.preventDefault();
    opener.current?.focus({ preventScroll: true });
  };

  return {
    ...target,
    isDirty,
    isFormDirty: dirty.isFormDirty,
    reportDirty: dirty.report,
    isDiscardOpen: pending !== null,
    cancelDiscard: () => setPending(null),
    discardChanges,
    selectView: (view: CatalogNavigationTarget["view"]) => navigate({ view, editingId: null }),
    edit: (editingId: string) => navigate({ ...target, editingId }),
    startCreate: () => navigate({ ...target, editingId: NEW_RECORD }),
    closeEditor: () => navigate({ ...target, editingId: null }),
    saved: () => go({ ...target, editingId: null }),
    restoreFocus,
  };
}
