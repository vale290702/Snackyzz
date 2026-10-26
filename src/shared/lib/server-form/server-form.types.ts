import type { BaseSyntheticEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import type { Result, SharedErrorCode } from "../result";

/**
 * A form's schema: an object whose keys are the form's fields.
 */
export type ServerFormSchema = z.ZodObject;

/**
 * The values a form holds while the user edits it, before the schema parses them.
 */
export type ServerFormValues<InputSchema extends ServerFormSchema> = z.input<InputSchema>;

/**
 * A field name of a form schema.
 */
export type ServerFormField<InputSchema extends ServerFormSchema> = keyof z.input<InputSchema> &
  string;

/**
 * One error code per invalid field; schema messages outside the listed codes become `invalid_input`.
 */
export type ServerFormFieldErrors<Field extends string, FieldErrorCode extends string> = Partial<
  Record<Field, FieldErrorCode | SharedErrorCode>
>;

/**
 * The Server Action a form sends its parsed input to.
 */
export type ServerFormAction<
  InputSchema extends ServerFormSchema,
  Value,
  ErrorCode extends string,
> = (input: z.output<InputSchema>) => Promise<Result<Value, ErrorCode | SharedErrorCode>>;

/**
 * What `useServerForm` needs: the schema, the record's current values, the action, the codes the
 * schema reports, and what to tell the caller.
 */
export type ServerFormOptions<
  InputSchema extends ServerFormSchema,
  Value,
  ErrorCode extends string,
  FieldErrorCode extends string,
> = {
  schema: InputSchema;
  values: ServerFormValues<InputSchema>;
  action: ServerFormAction<InputSchema, Value, ErrorCode>;
  fieldErrorCodes?: readonly FieldErrorCode[];
  onSuccess?: ((value: Value) => void) | undefined;
  onDirtyChange?: ((isDirty: boolean) => void) | undefined;
};

/**
 * What `useServerForm` returns to a feature hook.
 */
export type ServerForm<
  InputSchema extends ServerFormSchema,
  ErrorCode extends string,
  FieldErrorCode extends string,
> = {
  form: UseFormReturn<ServerFormValues<InputSchema>, unknown, z.output<InputSchema>>;
  submit: (event?: BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  fieldErrors: ServerFormFieldErrors<ServerFormField<InputSchema>, FieldErrorCode>;
  formError: ErrorCode | SharedErrorCode | null;
};
