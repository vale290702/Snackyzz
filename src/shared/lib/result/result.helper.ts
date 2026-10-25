import type { Result } from "./result.types";

/**
 * Constructors and guards for expected operation outcomes.
 */
export class Results {
  private constructor() {}

  /**
   * Wraps a successful value.
   * @param value The value produced by the operation.
   * @returns A successful result.
   */
  static ok<Value>(value: Value): Result<Value, never> {
    return { ok: true, value };
  }

  /**
   * Wraps an expected failure.
   * @param error Stable error code, translated in `errors.json`.
   * @param meta Extra details for logs and error copy.
   * @returns A failed result.
   */
  static err<ErrorCode extends string>(
    error: ErrorCode,
    meta?: Record<string, unknown>,
  ): Result<never, ErrorCode> {
    if (meta === undefined) {
      return { ok: false, error };
    }

    return { ok: false, error, meta };
  }

  /**
   * Narrows a result to its successful branch.
   * @param result The result to check.
   * @returns True when the result holds a value.
   */
  static isOk<Value, ErrorCode extends string>(
    result: Result<Value, ErrorCode>,
  ): result is { ok: true; value: Value } {
    return result.ok;
  }
}

/**
 * Compatibility entry point for successful results.
 */
export const ok = Results.ok;

/**
 * Compatibility entry point for expected failures.
 */
export const err = Results.err;

/**
 * Compatibility entry point for successful-result narrowing.
 */
export const isOk = Results.isOk;
