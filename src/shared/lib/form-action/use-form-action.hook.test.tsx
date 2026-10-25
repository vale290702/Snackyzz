import { act, renderHook } from "@testing-library/react";
import { startTransition } from "react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { FormActionStatus, useFormAction } from ".";

const schema = z.object({ email: z.email({ error: "email_invalid" }) });

function emailForm(email: string): FormData {
  const data = new FormData();
  data.set("email", email);

  return data;
}

describe("useFormAction", () => {
  it("starts idle with no values or errors", () => {
    const { result } = renderHook(() => useFormAction({ schema, action: vi.fn() }));

    expect(result.current).toMatchObject({
      isPending: false,
      state: { status: FormActionStatus.Idle },
      values: {},
      fieldErrors: {},
      formError: null,
    });
  });

  it("exposes field errors and restored values after an invalid submission", async () => {
    const action = vi.fn();
    const { result } = renderHook(() =>
      useFormAction({
        schema,
        action,
        fieldErrorCodes: ["email_invalid"],
        preserve: ["email"],
      }),
    );

    await act(async () => {
      startTransition(() => result.current.formAction(emailForm("ana@")));
    });

    expect(action).not.toHaveBeenCalled();
    expect(result.current.values).toEqual({ email: "ana@" });
    expect(result.current.fieldErrors).toEqual({ email: "email_invalid" });
  });

  it("exposes the action's error and is pending while it runs", async () => {
    const action = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: "too_many_attempts" })
      .mockReturnValueOnce(new Promise(() => {}));
    const { result } = renderHook(() => useFormAction({ schema, action }));

    await act(async () => {
      startTransition(() => result.current.formAction(emailForm("ana@snackyzz.test")));
    });
    expect(result.current.formError).toBe("too_many_attempts");

    await act(async () => {
      startTransition(() => result.current.formAction(emailForm("ana@snackyzz.test")));
    });
    expect(result.current.isPending).toBe(true);
  });
});
