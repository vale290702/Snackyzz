import { act, renderHook } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { startTransition, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import messages from "@/i18n/messages/es-CR";

import { useSignInForm } from "./use-sign-in-form.hook";
import { signInAction } from "../../server/sign-in/sign-in.actions";

vi.mock("../../server/sign-in/sign-in.actions", () => ({ signInAction: vi.fn() }));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="es-CR" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

function credentials(email: string, password: string): FormData {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", password);

  return formData;
}

async function submit(result: { current: ReturnType<typeof useSignInForm> }, formData: FormData) {
  await act(async () => {
    startTransition(() => result.current.formAction(formData));
  });
}

describe("useSignInForm", () => {
  beforeEach(() => {
    vi.mocked(signInAction).mockReset();
  });

  it("starts with an empty form and no errors", () => {
    const { result } = renderHook(useSignInForm, { wrapper });

    expect(result.current).toMatchObject({
      isPending: false,
      email: "",
      emailError: null,
      passwordError: null,
      formError: null,
    });
  });

  it("shows field errors without calling the server when the input is invalid", async () => {
    const { result } = renderHook(useSignInForm, { wrapper });

    await submit(result, credentials("staff@", ""));

    expect(signInAction).not.toHaveBeenCalled();
    expect(result.current.emailError).toBe(messages.errors.access.email_invalid);
    expect(result.current.passwordError).toBe(messages.errors.access.password_required);
    expect(result.current.email).toBe("staff@");
  });

  it("sends parsed credentials and shows the generic error, keeping the email", async () => {
    vi.mocked(signInAction).mockResolvedValue({ ok: false, error: "invalid_credentials" });
    const { result } = renderHook(useSignInForm, { wrapper });

    await submit(result, credentials(" staff@snackyzz.test ", "wrong"));

    expect(signInAction).toHaveBeenCalledWith({
      email: "staff@snackyzz.test",
      password: "wrong",
    });
    expect(result.current.formError).toBe(messages.errors.access.invalid_credentials);
    expect(result.current.emailError).toBeNull();
    expect(result.current.email).toBe(" staff@snackyzz.test ");
  });

  it("translates shared boundary failures", async () => {
    vi.mocked(signInAction).mockResolvedValue({ ok: false, error: "unexpected" });
    const { result } = renderHook(useSignInForm, { wrapper });

    await submit(result, credentials("staff@snackyzz.test", "snackyzz-demo"));

    expect(result.current.formError).toBe(messages.errors.shared.unexpected);
  });

  it("clears a previous error on the next attempt", async () => {
    vi.mocked(signInAction)
      .mockResolvedValueOnce({ ok: false, error: "too_many_attempts" })
      .mockReturnValueOnce(new Promise(() => {}));
    const { result } = renderHook(useSignInForm, { wrapper });

    await submit(result, credentials("staff@snackyzz.test", "wrong"));
    expect(result.current.formError).toBe(messages.errors.access.too_many_attempts);

    await submit(result, credentials("staff@snackyzz.test", "snackyzz-demo"));
    expect(result.current.isPending).toBe(true);
  });
});
