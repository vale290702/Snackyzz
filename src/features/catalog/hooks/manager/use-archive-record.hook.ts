"use client";

import { useState } from "react";

import { useRecordAction } from "./use-record-action.hook";
import type { RecordActionValue } from "../../domain/manager";

/**
 * State for an archive button that asks first: the confirmation's open state and the archive form.
 * @param action Which archive the confirmation submits.
 * @returns Whether the confirmation is open with its handler, and the archive form's state.
 */
export function useArchiveRecord(action: RecordActionValue) {
  const [isOpen, setIsOpen] = useState(false);
  const archive = useRecordAction(action, () => setIsOpen(false));

  return { isOpen, setIsOpen, ...archive };
}
