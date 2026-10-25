import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { FormActionStatus, FormSubmission } from ".";

const schema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email({ error: "email_invalid" })),
  password: z.string().min(1, { error: "password_required" }),
});

function credentials(email: string, password: string): FormData {
  const data = new FormData();
  data.set("email", email);
  data.set("password", password);

  return data;
}

describe("FormSubmission.submit", () => {
  it("returns invalid without calling the action", async () => {
    const action = vi.fn();

    const state = await FormSubmission.submit(
      { schema, action, fieldErrorCodes: ["email_invalid"], preserve: ["email"] },
      credentials("ana@", "secret"),
    );

    expect(action).not.toHaveBeenCalled();
    expect(state).toEqual({
      status: FormActionStatus.Invalid,
      values: { email: "ana@" },
      fieldErrors: { email: "email_invalid" },
      formError: null,
    });
  });

  it("sends the parsed input and keeps the action's error", async () => {
    const action = vi.fn().mockResolvedValue({ ok: false, error: "invalid_credentials" });

    const state = await FormSubmission.submit(
      { schema, action, preserve: ["email"] },
      credentials(" ana@snackyzz.test ", "wrong"),
    );

    expect(action).toHaveBeenCalledWith({ email: "ana@snackyzz.test", password: "wrong" });
    expect(state).toEqual({
      status: FormActionStatus.Failed,
      values: { email: " ana@snackyzz.test " },
      error: "invalid_credentials",
    });
  });

  it("keeps the action's value and never restores unlisted fields", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true, value: { id: "a1" } });

    const state = await FormSubmission.submit(
      { schema, action },
      credentials("ana@snackyzz.test", "secret"),
    );

    expect(state).toEqual({ status: FormActionStatus.Succeeded, values: {}, value: { id: "a1" } });
  });
});

describe("FormSubmission error selectors", () => {
  it("reads field and form errors from each status", () => {
    const idle = FormSubmission.idle();
    const invalid = {
      status: FormActionStatus.Invalid,
      values: {},
      fieldErrors: { email: "email_invalid" },
      formError: "invalid_input",
    } as const;
    const failed = { status: FormActionStatus.Failed, values: {}, error: "unexpected" } as const;

    expect(FormSubmission.fieldErrors(idle)).toEqual({});
    expect(FormSubmission.formError(idle)).toBeNull();
    expect(FormSubmission.fieldErrors(invalid)).toEqual({ email: "email_invalid" });
    expect(FormSubmission.formError(invalid)).toBe("invalid_input");
    expect(FormSubmission.fieldErrors(failed)).toEqual({});
    expect(FormSubmission.formError(failed)).toBe("unexpected");
  });
});
