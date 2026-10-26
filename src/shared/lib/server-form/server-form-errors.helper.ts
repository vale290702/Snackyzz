import type { FieldError, FieldErrors, FieldValues } from "react-hook-form";

import type { ServerFormFieldErrors } from "./server-form.types";
import { SharedError } from "../result";

/**
 * Turns React Hook Form's field errors into the error codes components translate.
 */
export class ServerFormErrors {
  private constructor() {}

  /**
   * Reads one code per invalid field.
   * @param errors The form's errors; schema issue messages are codes.
   * @param codes The codes the schema reports; any other message becomes `invalid_input`.
   * @returns The code of each invalid field.
   */
  static fieldCodes<Field extends string, FieldErrorCode extends string>(
    errors: FieldErrors<FieldValues>,
    codes: readonly FieldErrorCode[],
  ): ServerFormFieldErrors<Field, FieldErrorCode> {
    const known: ReadonlySet<string> = new Set(codes);
    const entries = Object.entries(errors)
      .filter(([field]) => field !== "root")
      .map(([field, error]) => {
        const message = ServerFormErrors.message(error);
        const code = message !== null && known.has(message) ? message : SharedError.InvalidInput;

        return [field, code];
      });

    return Object.fromEntries(entries) as ServerFormFieldErrors<Field, FieldErrorCode>;
  }

  /**
   * The first message of a field's error, also for list fields whose items carry the message.
   * @param error A field's error entry.
   * @returns The message, or null when there is none.
   */
  private static message(error: unknown): string | null {
    if (!error || typeof error !== "object") {
      return null;
    }

    const { message } = error as Partial<FieldError>;
    if (typeof message === "string") {
      return message;
    }

    const nested = Object.values(error).map((entry) => ServerFormErrors.message(entry));

    return nested.find((entry) => entry !== null) ?? null;
  }
}
