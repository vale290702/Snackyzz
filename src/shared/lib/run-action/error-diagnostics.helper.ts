import { errorIdentifiersSchema } from "./error-diagnostics.schema";
import type { LogData } from "../logger";

/**
 * Safe diagnostics for unexpected exceptions, excluding arbitrary payloads.
 */
export class ErrorDiagnostics {
  private constructor() {}

  /**
   * Selects bounded error identifiers without logging messages, details or arbitrary payloads.
   * @param error Unexpected thrown value, including plain database error objects.
   * @returns Stack frames, a safe error name, thrown type and a SQLSTATE (null when unavailable).
   */
  static toLogData(error: unknown): LogData {
    const identifiers = errorIdentifiersSchema.parse({
      name: ErrorDiagnostics.readDataProperty(error, "name"),
      code: ErrorDiagnostics.readDataProperty(error, "code"),
    });

    return {
      ...identifiers,
      thrownType: typeof error,
      stack: ErrorDiagnostics.stackFrames(error),
    };
  }

  private static readDataProperty(error: unknown, property: string): unknown {
    if (typeof error !== "object" || error === null) return undefined;

    // Why: logging must not invoke accessors on a thrown object.
    const ownProperty = Object.getOwnPropertyDescriptor(error, property);
    if (ownProperty) return ownProperty.value;

    if (error instanceof Error) {
      const prototype = Object.getPrototypeOf(error);
      return Object.getOwnPropertyDescriptor(prototype, property)?.value;
    }

    return undefined;
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
