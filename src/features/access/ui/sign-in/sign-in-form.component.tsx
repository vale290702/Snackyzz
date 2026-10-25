"use client";

import { ArrowRight, Lock } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

import { useSignInForm } from "../../hooks/sign-in/use-sign-in-form.hook";

const EMAIL_ERROR_ID = "admin-email-error";
const PASSWORD_ERROR_ID = "admin-password-error";

/**
 * The admin sign-in card: email, password and the submit button.
 * @returns The sign-in form.
 */
export function SignInForm() {
  const { formAction, isPending, email, emailError, passwordError, formError } = useSignInForm();
  const translate = useTranslations("access.signIn");

  return (
    <form
      action={formAction}
      aria-labelledby="sign-in-title"
      className="rounded-surface bg-paper p-6.5 sm:p-7 md:p-10"
    >
      <Lock aria-hidden className="mb-6 size-8" strokeWidth={1.7} />
      <h2
        id="sign-in-title"
        className="font-display text-3xl leading-display font-bold tracking-display text-balance"
      >
        {translate("title")}
      </h2>
      <p className="mt-3.5 text-sm text-muted-foreground">{translate("description")}</p>

      <FieldGroup className="mt-4.75 gap-4.75">
        <Field data-invalid={Boolean(emailError)}>
          <FieldLabel htmlFor="admin-email" className="text-xs font-semibold">
            {translate("email.label")}
          </FieldLabel>
          <Input
            id="admin-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            defaultValue={email}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? EMAIL_ERROR_ID : undefined}
          />
          <FieldError id={EMAIL_ERROR_ID}>{emailError}</FieldError>
        </Field>
        <Field data-invalid={Boolean(passwordError)}>
          <FieldLabel htmlFor="admin-password" className="text-xs font-semibold">
            {translate("password.label")}
          </FieldLabel>
          <Input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={isPending}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={passwordError ? PASSWORD_ERROR_ID : undefined}
          />
          <FieldError id={PASSWORD_ERROR_ID}>{passwordError}</FieldError>
        </Field>
      </FieldGroup>

      {formError && (
        <p
          role="alert"
          className="my-5 rounded-control bg-destructive/15 px-4.5 py-4 text-sm text-destructive"
        >
          {formError}
        </p>
      )}

      <Button
        type="submit"
        variant="dark"
        disabled={isPending}
        className="mt-6.5 w-full gap-5 text-sm font-bold"
      >
        {isPending ? translate("submitting") : translate("submit")}
        <ArrowRight aria-hidden className="size-5" strokeWidth={1.7} />
      </Button>
    </form>
  );
}
