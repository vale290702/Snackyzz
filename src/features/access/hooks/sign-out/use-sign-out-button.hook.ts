"use client";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { FormInput, useFormAction } from "@/shared/lib/form-action";

import { signOutAction } from "../../server/sign-out/sign-out.actions";

/**
 * State and handlers for the sign-out button.
 * @returns The form action, pending flag and a translated error when signing out failed.
 */
export function useSignOutButton() {
  const form = useFormAction({ schema: FormInput.none, action: signOutAction });
  const errorMessage = useErrorMessage("access");

  return {
    formAction: form.formAction,
    isPending: form.isPending,
    errorMessage: errorMessage(form.formError),
  };
}
