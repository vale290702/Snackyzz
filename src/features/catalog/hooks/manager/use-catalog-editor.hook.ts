"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { CatalogEditorChecks } from "./catalog-editor-checks.helper";
import type { CatalogEditorState } from "./catalog-editor.types";

/**
 * Inputs for the sheet's dirty checks and success feedback.
 */
type CatalogEditorOptions = {
  registerChecks: (checks: CatalogEditorState) => void;
  onSaved: () => void;
  savedMessage: string;
};

/**
 * Protects the editor's forms and coordinates presentation editing with product changes.
 * @param options The manager's live check ref and translated save feedback.
 * @returns The body ref, dirty checks, presentation state and success handlers.
 */
export function useCatalogEditor({ registerChecks, onSaved, savedMessage }: CatalogEditorOptions) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const checks = useMemo(() => new CatalogEditorChecks(bodyRef), []);
  const [needsSave, setNeedsSave] = useState(false);
  const [isPresentationOpen, setIsPresentationOpen] = useState(false);

  useEffect(() => {
    registerChecks(checks);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (checks.hasChanges() || checks.isBusy()) event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      registerChecks({ hasChanges: () => false, isBusy: () => false });
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [checks, registerChecks]);

  const attachBody = useCallback((body: HTMLDivElement | null) => {
    bodyRef.current = body;
  }, []);

  return {
    attachBody,
    rememberForms: () => checks.remember(),
    hasChanges: () => checks.hasChanges(),
    isBusy: () => checks.isBusy(),
    needsSave,
    isPresentationOpen,
    setIsPresentationOpen,
    beforePresentationEdit: () => {
      const blocked = checks.hasChanges() || checks.isBusy();
      setNeedsSave(blocked);
      return !blocked;
    },
    saved: () => {
      toast.success(savedMessage);
      onSaved();
    },
    presentationSaved: () => {
      toast.success(savedMessage);
      checks.reset();
    },
  };
}
