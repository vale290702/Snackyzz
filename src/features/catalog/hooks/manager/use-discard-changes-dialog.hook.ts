"use client";

import { useRef } from "react";

/**
 * Focus handling for the discard prompt, which opens without a trigger of its own.
 * @returns Handlers that remember what had focus when the prompt opened and move focus back on close.
 */
export function useDiscardChangesDialog() {
  // Radix returns focus only to a dialog's own trigger; without one it falls to the page body.
  const returnTo = useRef<HTMLElement | null>(null);

  const rememberFocus = () => {
    returnTo.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
  };

  const restoreFocus = (event: Event) => {
    event.preventDefault();
    returnTo.current?.focus();
  };

  return { rememberFocus, restoreFocus };
}
