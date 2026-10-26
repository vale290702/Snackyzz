"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useEffectEvent, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import type { z } from "zod";

import { ServerFormErrors } from "./server-form-errors.helper";
import type {
  ServerForm,
  ServerFormField,
  ServerFormOptions,
  ServerFormSchema,
  ServerFormValues,
} from "./server-form.types";
import { SharedError, type SharedErrorCode } from "../result";

/**
 * The schema's resolver, typed by the schema's own input and output.
 * @param schema The form's schema.
 * @returns The resolver React Hook Form parses with.
 */
function resolverFor<InputSchema extends ServerFormSchema>(schema: InputSchema) {
  // zodResolver can't relate a generic schema to its input and output types; callers' schemas are concrete.
  return zodResolver(schema) as unknown as Resolver<
    ServerFormValues<InputSchema>,
    unknown,
    z.output<InputSchema>
  >;
}

/**
 * Tells the caller when the form becomes dirty or clean, and clean once it unmounts.
 * @param isDirty Whether the form's values differ from the record's.
 * @param onDirtyChange The caller's callback, if any.
 */
function useReportDirty(isDirty: boolean, onDirtyChange: ((isDirty: boolean) => void) | undefined) {
  const report = useEffectEvent((dirty: boolean) => onDirtyChange?.(dirty));

  useEffect(() => report(isDirty), [isDirty]);
  useEffect(() => () => report(false), []);
}

/**
 * A React Hook Form form that parses with its schema and submits to a Server Action.
 * @param options The schema, the record's current values, the action, the schema's codes, and the
 * success and dirty-state callbacks.
 * @returns The form, its submit handler and pending flag, and the field and form error codes.
 */
export function useServerForm<
  InputSchema extends ServerFormSchema,
  Value,
  ErrorCode extends string,
  FieldErrorCode extends string = never,
>({
  schema,
  values,
  action,
  fieldErrorCodes = [],
  onSuccess,
  onDirtyChange,
}: ServerFormOptions<InputSchema, Value, ErrorCode, FieldErrorCode>): ServerForm<
  InputSchema,
  ErrorCode,
  FieldErrorCode
> {
  // Server values replace the form's when the records refresh; fields the user changed stay.
  const form = useForm<ServerFormValues<InputSchema>, unknown, z.output<InputSchema>>({
    resolver: resolverFor(schema),
    values,
    resetOptions: { keepDirtyValues: true },
  });
  const [formError, setFormError] = useState<ErrorCode | SharedErrorCode | null>(null);
  const { errors, isDirty, isSubmitting } = form.formState;

  useReportDirty(isDirty, onDirtyChange);

  const send = async (input: z.output<InputSchema>) => {
    setFormError(null);

    const result = await action(input).catch(() => null);
    if (!result) {
      setFormError(SharedError.Unexpected);
      return;
    }
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    onSuccess?.(result.value);
  };

  return {
    form,
    submit: form.handleSubmit(send),
    isSubmitting,
    fieldErrors: ServerFormErrors.fieldCodes<ServerFormField<InputSchema>, FieldErrorCode>(
      errors,
      fieldErrorCodes,
    ),
    formError,
  };
}
