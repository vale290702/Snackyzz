import { act, renderHook } from "@testing-library/react";
import { startTransition } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSignInForm } from "./use-sign-in-form.hook";
import { signInAction } from "../../server/sign-in/sign-in.actions";

vi.mock("../../server/sign-in/sign-in.actions", () => ({ signInAction: vi.fn() }));

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
    const { result } = renderHook(useSignInForm);

    expect(result.current).toMatchObject({
      isPending: false,
      values: {},
      fieldErrors: {},
      formError: null,
    });
  });

  it("reports field codes without calling the server when the input is invalid", async () => {
    const { result } = renderHook(useSignInForm);

    await submit(result, credentials("staff@", ""));

    expect(signInAction).not.toHaveBeenCalled();
    expect(result.current.fieldErrors).toEqual({
      email: "email_invalid",
      password: "password_required",
    });
    expect(result.current.values).toEqual({ email: "staff@" });
  });

  it("sends parsed credentials, keeps the action's code and restores only the email", async () => {
    vi.mocked(signInAction).mockResolvedValue({ ok: false, error: "invalid_credentials" });
    const { result } = renderHook(useSignInForm);

    await submit(result, credentials(" staff@snackyzz.test ", "wrong"));

    expect(signInAction).toHaveBeenCalledWith({
      email: "staff@snackyzz.test",
      password: "wrong",
    });
    expect(result.current.formError).toBe("invalid_credentials");
    expect(result.current.fieldErrors).toEqual({});
    expect(result.current.values).toEqual({ email: " staff@snackyzz.test " });
  });

  it("clears a previous error on the next attempt", async () => {
    vi.mocked(signInAction)
      .mockResolvedValueOnce({ ok: false, error: "too_many_attempts" })
      .mockReturnValueOnce(new Promise(() => {}));
    const { result } = renderHook(useSignInForm);

    await submit(result, credentials("staff@snackyzz.test", "wrong"));
    expect(result.current.formError).toBe("too_many_attempts");

    await submit(result, credentials("staff@snackyzz.test", "snackyzz-demo"));
    expect(result.current.isPending).toBe(true);
  });
});
