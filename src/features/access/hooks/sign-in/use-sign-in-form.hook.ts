"use client";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { useFormAction } from "@/shared/lib/form-action";

import { SignInFieldError, signInInputSchema } from "../../domain/sign-in";
import { signInAction } from "../../server/sign-in/sign-in.actions";

/**
 * State and handlers for the admin sign-in form.
 * @returns The form action, pending flag, the email to restore after a failure, and translated errors.
 */
export function useSignInForm() {
  const form = useFormAction({
    schema: signInInputSchema,
    action: signInAction,
    fieldErrorCodes: Object.values(SignInFieldError),
    preserve: ["email"],
  });
  const errorMessage = useErrorMessage("access");

  return {
    formAction: form.formAction,
    isPending: form.isPending,
    email: form.values.email ?? "",
    emailError: errorMessage(form.fieldErrors.email),
    passwordError: errorMessage(form.fieldErrors.password),
    formError: errorMessage(form.formError),
  };
}
