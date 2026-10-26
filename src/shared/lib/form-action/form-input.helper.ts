import { z } from "zod";

import { FormFieldKind } from "./form-action.constants";
import type {
  FieldErrors,
  FormField,
  FormFieldKinds,
  FormFieldKindValue,
  FormSchema,
  FormValues,
  ParsedForm,
} from "./form-action.types";
import { SharedError } from "../result";

/**
 * Pure conversions from submitted `FormData` to typed form input.
 */
export class FormInput {
  private constructor() {}

  /**
   * The schema for forms that submit no fields, such as a sign-out button.
   */
  static readonly none = z.object({});

  /**
   * Parses the schema's fields out of submitted form data.
   * @param schema Object schema whose issue messages are error codes, not copy.
   * @param formData The submitted form data; the first entry of each field is read.
   * @param fieldErrorCodes Every code the schema can report; other messages become `invalid_input`.
   * @param fieldKinds Fields read as a checkbox or a list instead of the first text entry.
   * @returns The parsed input, or one code per invalid field plus any form-level code.
   */
  static read<InputSchema extends FormSchema, FieldErrorCode extends string>(
    schema: InputSchema,
    formData: FormData,
    fieldErrorCodes: readonly FieldErrorCode[],
    fieldKinds: FormFieldKinds<FormField<InputSchema>> = {},
  ): ParsedForm<z.output<InputSchema>, FormField<InputSchema>, FieldErrorCode> {
    const fields = Object.keys(schema.shape) as FormField<InputSchema>[];
    const raw = Object.fromEntries(
      fields.map((field) => [field, FormInput.entry(formData, field, fieldKinds[field])]),
    );

    const parsed = schema.safeParse(raw);
    if (parsed.success) {
      return { ok: true, input: parsed.data };
    }

    const knownCodes: ReadonlySet<string> = new Set(fieldErrorCodes);
    const toCode = (message: string | undefined) =>
      message !== undefined && knownCodes.has(message)
        ? (message as FieldErrorCode)
        : SharedError.InvalidInput;

    // Typed loosely because the schema is generic; keys are always the schema's own fields.
    const flattened = z.flattenError(parsed.error) as {
      formErrors: string[];
      fieldErrors: Partial<Record<FormField<InputSchema>, string[]>>;
    };

    const fieldErrors: FieldErrors<FormField<InputSchema>, FieldErrorCode> = {};
    for (const field of Object.keys(flattened.fieldErrors) as FormField<InputSchema>[]) {
      fieldErrors[field] = toCode(flattened.fieldErrors[field]?.[0]);
    }

    return {
      ok: false,
      fieldErrors,
      formError: flattened.formErrors.length > 0 ? toCode(flattened.formErrors[0]) : null,
    };
  }

  /**
   * Reads one field's raw value the way its kind is submitted.
   * @param formData The submitted form data.
   * @param field The field name.
   * @param kind How the field is submitted; plain text when missing.
   * @returns The first entry, whether a checkbox was submitted, or every text entry.
   */
  private static entry(
    formData: FormData,
    field: string,
    kind: FormFieldKindValue = FormFieldKind.Text,
  ): FormDataEntryValue | boolean | string[] | undefined {
    if (kind === FormFieldKind.Checkbox) {
      return formData.has(field);
    }

    if (kind === FormFieldKind.List) {
      return formData.getAll(field).filter((value) => typeof value === "string");
    }

    return formData.get(field) ?? undefined;
  }

  /**
   * Copies the raw text of selected fields, so a form can restore them after React resets it.
   * @param formData The submitted form data.
   * @param fields Fields to keep; never list secrets such as passwords.
   * @returns The text of each listed field that was submitted as text.
   */
  static values<Field extends string>(
    formData: FormData,
    fields: readonly Field[],
  ): FormValues<Field> {
    const values: FormValues<Field> = {};
    for (const field of fields) {
      const value = formData.get(field);
      if (typeof value === "string") {
        values[field] = value;
      }
    }

    return values;
  }
}
