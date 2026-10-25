"use client";

import { useActionState } from "react";

import type { FormAction, FormActionOptions, FormField, FormSchema } from "./form-action.types";
import { FormSubmission } from "./form-submission.helper";

/**
 * Submits a `<form action>` through its schema and Server Action, keeping the outcome as state.
 * @param options The schema, the Server Action, the codes the schema reports and the fields to restore.
 * @returns The form action and pending flag, the full state, restored values and error codes.
 */
export function useFormAction<
  InputSchema extends FormSchema,
  Value,
  ErrorCode extends string,
  FieldErrorCode extends string = never,
>(
  options: FormActionOptions<InputSchema, Value, ErrorCode, FieldErrorCode>,
): FormAction<FormField<InputSchema>, FieldErrorCode, Value, ErrorCode> {
  const [state, formAction, isPending] = useActionState(
    (_previous: unknown, formData: FormData) => FormSubmission.submit(options, formData),
    FormSubmission.idle<FormField<InputSchema>, FieldErrorCode, Value, ErrorCode>(),
  );

  return {
    formAction,
    isPending,
    state,
    values: state.values,
    fieldErrors: FormSubmission.fieldErrors(state),
    formError: FormSubmission.formError(state),
  };
}
