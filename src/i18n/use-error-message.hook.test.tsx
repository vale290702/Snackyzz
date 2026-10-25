import { renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import messages from "./messages/es-CR";
import { useErrorMessage } from "./use-error-message.hook";

function wrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="es-CR" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

describe("useErrorMessage", () => {
  it("reads feature codes from the namespace and shared codes from errors.shared", () => {
    const { result } = renderHook(() => useErrorMessage("access"), { wrapper });

    expect(result.current("invalid_credentials")).toBe(messages.errors.access.invalid_credentials);
    expect(result.current("unexpected")).toBe(messages.errors.shared.unexpected);
  });

  it("returns null when there is no code", () => {
    const { result } = renderHook(() => useErrorMessage("access"), { wrapper });

    expect(result.current(null)).toBeNull();
    expect(result.current(undefined)).toBeNull();
  });
});
