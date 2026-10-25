/**
 * Safe diagnostics for unexpected exceptions, excluding arbitrary payloads.
 */
export class ErrorDiagnostics {
  private constructor() {}

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
