import type { LogFieldKind } from "./log-sanitizer.constants";

/**
 * Redaction treatment assigned to a diagnostic field.
 */
export type LogFieldKindValue = (typeof LogFieldKind)[keyof typeof LogFieldKind];

/**
 * Field kinds whose values are masked rather than withheld.
 */
export type MaskedLogFieldKind = Exclude<LogFieldKindValue, typeof LogFieldKind.Sensitive>;
