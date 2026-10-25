"use client";

import { FormInput, useFormAction } from "@/shared/lib/form-action";

import { signOutAction } from "../../server/sign-out/sign-out.actions";

/**
 * State and handlers for the sign-out button.
 * @returns The form action, pending flag and an error code when signing out failed.
 */
export function useSignOutButton() {
  return useFormAction({ schema: FormInput.none, action: signOutAction });
}
