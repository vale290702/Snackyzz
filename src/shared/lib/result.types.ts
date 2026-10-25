import type { SharedError } from "./result.constants";

/** Error codes owned by the shared server boundaries. */
export type SharedErrorCode = (typeof SharedError)[keyof typeof SharedError];

/** Outcome of an operation that can fail in an expected way. */
export type Result<Value, ErrorCode extends string = string> =
  { ok: true; value: Value } | { ok: false; error: ErrorCode; meta?: Record<string, unknown> };
