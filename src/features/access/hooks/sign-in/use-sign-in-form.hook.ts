"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { z } from "zod";

import type { SharedErrorCode } from "@/shared/lib/result";

import { AccessError, type AccessErrorCode } from "../../domain/errors";
import {
  SignInFieldError,
  signInInputSchema,
  type SignInFieldErrorCode,
} from "../../domain/sign-in";
import { signInAction } from "../../server/sign-in/sign-in.actions";

/**
 * Every failure the sign-in form can show; access codes have copy under `errors.access`.
 */
type SignInErrorCode = AccessErrorCode | SignInFieldErrorCode | SharedErrorCode;

/**
 * What the sign-in form shows after an attempt.
 */
type SignInFormState = {
  email: string;
  emailError: SignInFieldErrorCode | null;
  passwordError: SignInFieldErrorCode | null;
  formError: AccessErrorCode | SharedErrorCode | null;
};

const initialState: SignInFormState = {
  email: "",
  emailError: null,
  passwordError: null,
  formError: null,
};

const accessErrorCodes: ReadonlySet<SignInErrorCode> = new Set([
  ...Object.values(AccessError),
  ...Object.values(SignInFieldError),
]);

/**
 * State and handlers for the admin sign-in form.
 * @returns The form action, pending flag, the email to restore after a failure, and translated errors.
 */
export function useSignInForm() {
  const [state, formAction, isPending] = useActionState(submitSignIn, initialState);
  const translateError = useTranslations("errors");

  const translate = (code: SignInErrorCode | null) => {
    if (code === null) {
      return null;
    }

    return isAccessErrorCode(code)
      ? translateError(`access.${code}`)
      : translateError(`shared.${code}`);
  };

  return {
    formAction,
    isPending,
    email: state.email,
    emailError: translate(state.emailError),
    passwordError: translate(state.passwordError),
    formError: translate(state.formError),
  };
}

async function submitSignIn(
  _previous: SignInFormState,
  formData: FormData,
): Promise<SignInFormState> {
  const email = String(formData.get("email") ?? "");
  const parsed = signInInputSchema.safeParse({
    email,
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    // The schema's issue messages are SignInFieldError codes, not copy.
    const { fieldErrors } = z.flattenError(parsed.error);

    return {
      ...initialState,
      email,
      emailError: (fieldErrors.email?.[0] as SignInFieldErrorCode | undefined) ?? null,
      passwordError: (fieldErrors.password?.[0] as SignInFieldErrorCode | undefined) ?? null,
    };
  }

  const result = await signInAction(parsed.data);

  return {
    ...initialState,
    email,
    formError: result.ok ? null : result.error,
  };
}

function isAccessErrorCode(code: SignInErrorCode): code is AccessErrorCode | SignInFieldErrorCode {
  return accessErrorCodes.has(code);
}
