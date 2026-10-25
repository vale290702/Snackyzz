import { act, renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { startTransition, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import messages from "@/i18n/messages/es-CR";

import { useSignOutButton } from "./use-sign-out-button.hook";
import { signOutAction } from "../../server/sign-out/sign-out.actions";

vi.mock("../../server/sign-out/sign-out.actions", () => ({ signOutAction: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="es-CR" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

describe("useSignOutButton", () => {
  beforeEach(() => {
    vi.mocked(signOutAction).mockReset();
  });

  it("shows the sign-out failure copy when the session could not be ended", async () => {
    vi.mocked(signOutAction).mockResolvedValue({ ok: false, error: "sign_out_failed" });
    const { result } = renderHook(useSignOutButton, { wrapper });

    expect(result.current.errorMessage).toBeNull();
    await act(async () => {
      startTransition(() => result.current.formAction());
    });

    expect(signOutAction).toHaveBeenCalledOnce();
    expect(result.current.errorMessage).toBe(messages.errors.access.sign_out_failed);
  });

  it("is pending while the action runs", async () => {
    vi.mocked(signOutAction).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(useSignOutButton, { wrapper });

    await act(async () => {
      startTransition(() => result.current.formAction());
    });

    expect(result.current.isPending).toBe(true);
  });
});
