"use client";

import { useFormAction } from "@/shared/lib/form-action";

import { SignInFieldError, signInInputSchema } from "../../domain/sign-in";
import { signInAction } from "../../server/sign-in/sign-in.actions";

/**
 * State and handlers for the admin sign-in form.
 * @returns The form action, pending flag, the restored email, and error codes for the form to translate.
 */
export function useSignInForm() {
  return useFormAction({
    schema: signInInputSchema,
    action: signInAction,
    fieldErrorCodes: Object.values(SignInFieldError),
    preserve: ["email"],
  });
}
