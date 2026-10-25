/** Error codes owned by the shared server boundaries. */
export type SharedErrorCode = "unexpected" | "forbidden" | "invalid_input";

/** Outcome of an operation that can fail in an expected way. */
export type Result<T, E extends string = string> =
  { ok: true; value: T } | { ok: false; error: E; meta?: Record<string, unknown> };

/**
 * Wraps a successful value.
 * @param value The value produced by the operation.
 * @returns A successful result.
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Wraps an expected failure.
 * @param error Stable error code, translated in `errors.json`.
 * @param meta Extra details for logs and error copy.
 * @returns A failed result.
 */
export function err<E extends string>(error: E, meta?: Record<string, unknown>): Result<never, E> {
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
export function isOk<T, E extends string>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}
