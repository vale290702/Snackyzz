import type { ComponentProps, ReactNode } from "react";

import { Button } from "@/shared/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

/**
 * Props shared by the labelled text controls.
 */
type LabelledFieldProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode | undefined;
  error: string | null;
};

/**
 * Ids for the hint and error, so the control can point at the ones it shows.
 * @param id The control's id.
 * @param hint The hint, when there is one.
 * @param error The translated error, when there is one.
 * @returns The described-by ids, or undefined when there is nothing to describe.
 */
function describedBy(id: string, hint: ReactNode, error: string | null): string | undefined {
  const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);

  return ids.length ? ids.join(" ") : undefined;
}

/**
 * A labelled text input with its hint and translated error.
 * @param props The id, label, optional hint and error, plus the native input props.
 * @returns The field.
 */
export function TextField({
  id,
  label,
  hint,
  error,
  ...input
}: LabelledFieldProps & ComponentProps<"input">) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id} className="text-xs font-semibold">
        {label}
      </FieldLabel>
      <Input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
        {...input}
      />
      {hint && <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription>}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  );
}

/**
 * A labelled multi-line input with its translated error.
 * @param props The id, label, optional hint and error, plus the native textarea props.
 * @returns The field.
 */
export function TextareaField({
  id,
  label,
  hint,
  error,
  ...textarea
}: LabelledFieldProps & ComponentProps<"textarea">) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id} className="text-xs font-semibold">
        {label}
      </FieldLabel>
      <Textarea
        id={id}
        rows={4}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, hint, error)}
        {...textarea}
      />
      {hint && <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription>}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  );
}

/**
 * The form-level error, announced as an alert; renders nothing without one.
 * @param props The translated message.
 * @returns The alert, or null.
 */
export function FormAlert({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <p
      role="alert"
      className="rounded-control bg-destructive/15 px-4.5 py-4 text-sm text-destructive"
    >
      {message}
    </p>
  );
}

/**
 * Props for a form's save button.
 */
type SaveButtonProps = {
  isPending: boolean;
  disabled: boolean;
  label: string;
  pendingLabel: string;
};

/**
 * The dark full-width save button, with its label while saving.
 * @param props Whether the form is saving or blocked, and both labels.
 * @returns The submit button.
 */
export function SaveButton({ isPending, disabled, label, pendingLabel }: SaveButtonProps) {
  return (
    <Button type="submit" variant="dark" disabled={disabled} className="w-full text-sm font-bold">
      {isPending ? pendingLabel : label}
    </Button>
  );
}
