import { ErrorDiagnostic } from "./error-diagnostics.constants";
import type { LogData } from "../logger";

/**
 * Safe diagnostics for unexpected exceptions, excluding arbitrary payloads.
 */
export class ErrorDiagnostics {
  private constructor() {}

  /**
   * Selects bounded error identifiers without logging messages, details or arbitrary payloads.
   * @param error Unexpected thrown value, including plain database error objects.
   * @returns Stack frames, a safe error name, thrown type and a SQLSTATE when present.
   */
  static describe(error: unknown): LogData {
    const diagnostics: Record<string, string> = {
      name: ErrorDiagnostic.UnknownName,
      thrownType: typeof error,
      stack: ErrorDiagnostics.stackFrames(error),
    };
    if (typeof error !== "object" || error === null) return diagnostics;

    const ownName = Object.getOwnPropertyDescriptor(error, "name");
    const inheritedName =
      error instanceof Error
        ? Object.getOwnPropertyDescriptor(Object.getPrototypeOf(error), "name")
        : undefined;
    const name: unknown = (ownName ?? inheritedName)?.value;
    if (typeof name === "string" && ErrorDiagnostic.NamePattern.test(name)) {
      diagnostics.name = name;
    } else if (error instanceof Error) {
      diagnostics.name = Error.name;
    }

    const code: unknown = Object.getOwnPropertyDescriptor(error, "code")?.value;
    if (typeof code === "string" && ErrorDiagnostic.SqlStatePattern.test(code)) {
      diagnostics.code = code;
    }

    return diagnostics;
  }

  /**
   * Retains stack frames without potentially sensitive exception messages.
   * @param error Unexpected thrown value.
   * @returns Stack frames, or an empty string when no Error stack exists.
   */
  static stackFrames(error: unknown): string {
    if (!(error instanceof Error)) return "";

    // Why: exception messages and arbitrary thrown payloads can contain credentials or input.
    return (error.stack ?? "")
      .split("\n")
      .filter((line) => /^\s+at /.test(line))
      .join("\n");
  }
}
