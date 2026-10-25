import type { z } from "zod";

import type { FormActionStatus } from "./form-action.constants";
import type { Result, SharedErrorCode } from "../result";

/**
 * A form's input schema: always an object whose keys are the form's field names.
 */
export type FormSchema = z.ZodObject;

/**
 * A field name of a form schema.
 */
export type FormField<InputSchema extends FormSchema> = keyof z.input<InputSchema> & string;

/**
 * Raw submitted text for the fields a form restores after React resets it.
 */
export type FormValues<Field extends string> = Partial<Record<Field, string>>;

/**
 * One error code per invalid field; unknown schema messages become `invalid_input`.
 */
export type FieldErrors<Field extends string, FieldErrorCode extends string> = Partial<
  Record<Field, FieldErrorCode | SharedErrorCode>
>;

/**
 * Why submitted form data failed its schema.
 */
export type InvalidForm<Field extends string, FieldErrorCode extends string> = {
  fieldErrors: FieldErrors<Field, FieldErrorCode>;
  formError: FieldErrorCode | SharedErrorCode | null;
};

/**
 * Submitted form data after its schema ran: the typed input, or why it is invalid.
 */
export type ParsedForm<Input, Field extends string, FieldErrorCode extends string> =
  { ok: true; input: Input } | ({ ok: false } & InvalidForm<Field, FieldErrorCode>);

/**
 * A Server Action a form submits parsed input to.
 */
export type FormServerAction<InputSchema extends FormSchema, Value, ErrorCode extends string> = (
  input: z.output<InputSchema>,
) => Promise<Result<Value, ErrorCode>>;

/**
 * The outcome of a form's latest submission; each status carries only what it can have.
 */
export type FormActionState<
  Field extends string,
  FieldErrorCode extends string,
  Value,
  ErrorCode extends string,
> =
  | { status: typeof FormActionStatus.Idle; values: FormValues<Field> }
  | ({ status: typeof FormActionStatus.Invalid; values: FormValues<Field> } & InvalidForm<
      Field,
      FieldErrorCode
    >)
  | {
      status: typeof FormActionStatus.Failed;
      values: FormValues<Field>;
      error: ErrorCode | SharedErrorCode;
    }
  | { status: typeof FormActionStatus.Succeeded; values: FormValues<Field>; value: Value };

/**
 * What `useFormAction` needs: the schema, the action, the codes the schema reports, the fields to restore.
 */
export type FormActionOptions<
  InputSchema extends FormSchema,
  Value,
  ErrorCode extends string,
  FieldErrorCode extends string,
> = {
  schema: InputSchema;
  action: FormServerAction<InputSchema, Value, ErrorCode>;
  fieldErrorCodes?: readonly FieldErrorCode[];
  preserve?: readonly FormField<InputSchema>[];
};

/**
 * What `useFormAction` returns to a feature hook.
 */
export type FormAction<
  Field extends string,
  FieldErrorCode extends string,
  Value,
  ErrorCode extends string,
> = {
  formAction: (formData: FormData) => void;
  isPending: boolean;
  state: FormActionState<Field, FieldErrorCode, Value, ErrorCode>;
  values: FormValues<Field>;
  fieldErrors: FieldErrors<Field, FieldErrorCode>;
  formError: ErrorCode | FieldErrorCode | SharedErrorCode | null;
};
