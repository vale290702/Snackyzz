"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";

import type { SharedErrorCode } from "@/shared/lib/result";

import { AccessError } from "../../domain/errors";
import { signOutAction } from "../../server/sign-out/sign-out.actions";

/**
 * Failures sign-out can report: its own code or a shared boundary failure.
 */
type SignOutErrorCode = typeof AccessError.SignOutFailed | SharedErrorCode;

/**
 * State and handlers for the sign-out button.
 * @returns The form action, pending flag and a translated error when signing out failed.
 */
export function useSignOutButton() {
  const [error, formAction, isPending] = useActionState(submitSignOut, null);
  const translateError = useTranslations("errors");

  let errorMessage: string | null = null;
  if (error === AccessError.SignOutFailed) {
    errorMessage = translateError(`access.${error}`);
  } else if (error !== null) {
    errorMessage = translateError(`shared.${error}`);
  }

  return {
    formAction,
    isPending,
    errorMessage,
  };
}

async function submitSignOut(): Promise<SignOutErrorCode | null> {
  const result = await signOutAction();

  return result.ok ? null : result.error;
}
