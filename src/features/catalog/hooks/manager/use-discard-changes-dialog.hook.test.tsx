import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useDiscardChangesDialog } from "./use-discard-changes-dialog.hook";

describe("useDiscardChangesDialog", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("moves focus back to what had it when the prompt opened", () => {
    const close = document.createElement("button");
    const other = document.createElement("button");
    document.body.append(close, other);
    const { result } = renderHook(() => useDiscardChangesDialog());

    close.focus();
    result.current.rememberFocus();
    other.focus();
    const event = new Event("focusScope.autoFocusOnUnmount", { cancelable: true });
    result.current.restoreFocus(event);

    expect(document.activeElement).toBe(close);
    expect(event.defaultPrevented).toBe(true);
  });
});
