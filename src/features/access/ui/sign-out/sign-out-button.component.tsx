"use client";

import { useTranslations } from "next-intl";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { Button } from "@/shared/ui/button";

import { useSignOutButton } from "../../hooks/sign-out/use-sign-out-button.hook";

/**
 * Ends the admin's session on this device.
 * @returns A one-button form, with an alert when signing out failed.
 */
export function SignOutButton() {
  const { formAction, isPending, formError } = useSignOutButton();
  const translate = useTranslations("access.signOut");
  const errorMessage = useErrorMessage("access")(formError);

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? translate("submitting") : translate("submit")}
      </Button>
      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
