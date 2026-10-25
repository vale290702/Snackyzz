import { FormActionStatus } from "./form-action.constants";
import type {
  FieldErrors,
  FormActionOptions,
  FormActionState,
  FormField,
  FormSchema,
} from "./form-action.types";
import { FormInput } from "./form-input.helper";
import type { SharedErrorCode } from "../result";

/**
 * Pure steps behind `useFormAction`: one submission in, the next form state out.
 */
export class FormSubmission {
  private constructor() {}

  /**
   * The state before the first submission.
   * @returns An idle state with no restored values.
   */
  static idle<
    Field extends string,
    FieldErrorCode extends string,
    Value,
    ErrorCode extends string,
  >(): FormActionState<Field, FieldErrorCode, Value, ErrorCode> {
    return { status: FormActionStatus.Idle, values: {} };
  }

  /**
   * Parses one submission and, when it is valid, sends it to the Server Action.
   * @param options The form's schema, action, field error codes and preserved fields.
   * @param formData The submitted form data.
   * @returns `invalid` without calling the action, otherwise `failed` or `succeeded`.
   */
  static async submit<
    InputSchema extends FormSchema,
    Value,
    ErrorCode extends string,
    FieldErrorCode extends string,
  >(
    options: FormActionOptions<InputSchema, Value, ErrorCode, FieldErrorCode>,
    formData: FormData,
  ): Promise<FormActionState<FormField<InputSchema>, FieldErrorCode, Value, ErrorCode>> {
    const values = FormInput.values(formData, options.preserve ?? []);
    const parsed = FormInput.read(options.schema, formData, options.fieldErrorCodes ?? []);

    if (!parsed.ok) {
      return {
        status: FormActionStatus.Invalid,
        values,
        fieldErrors: parsed.fieldErrors,
        formError: parsed.formError,
      };
    }

    const result = await options.action(parsed.input);

    return result.ok
      ? { status: FormActionStatus.Succeeded, values, value: result.value }
      : { status: FormActionStatus.Failed, values, error: result.error };
  }

  /**
   * The code to show next to each field.
   * @param state The form's current state.
   * @returns One code per invalid field; empty unless the last submission was invalid.
   */
  static fieldErrors<Field extends string, FieldErrorCode extends string>(
    state: FormActionState<Field, FieldErrorCode, unknown, string>,
  ): FieldErrors<Field, FieldErrorCode> {
    return state.status === FormActionStatus.Invalid ? state.fieldErrors : {};
  }

  /**
   * The code to show once for the whole form.
   * @param state The form's current state.
   * @returns The action's error, a form-level schema error, or null.
   */
  static formError<FieldErrorCode extends string, ErrorCode extends string>(
    state: FormActionState<string, FieldErrorCode, unknown, ErrorCode>,
  ): ErrorCode | FieldErrorCode | SharedErrorCode | null {
    if (state.status === FormActionStatus.Failed) {
      return state.error;
    }

    return state.status === FormActionStatus.Invalid ? state.formError : null;
  }
}
