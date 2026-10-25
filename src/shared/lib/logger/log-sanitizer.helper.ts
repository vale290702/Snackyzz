import { LogFieldKind, LogFieldRules, LogPattern, LogRedaction } from "./log-sanitizer.constants";
import type { LogFieldKindValue, MaskedLogFieldKind } from "./log-sanitizer.types";
import type { LogData } from "./logger.types";
import { Mask } from "./mask.helper";

/**
 * Defensive redaction for explicitly selected diagnostic fields.
 */
export class LogSanitizer {
  private constructor() {}

  /**
   * Masks embedded emails and removes URLs; phones must be supplied as named fields.
   * @param value Safe diagnostic text, never arbitrary secrets or user payloads.
   * @returns Text with common sensitive patterns concealed.
   */
  static text(value: string): string {
    return value
      .replace(LogPattern.EmbeddedUrl, LogRedaction.Url)
      .replace(LogPattern.EmbeddedEmail, (email) => Mask.email(email));
  }

  /**
   * Redacts sensitive keys and masks diagnostic values.
   * @param data Flat, explicitly selected safe diagnostic fields.
   * @returns A sanitized copy of the supplied fields.
   */
  static fields(data: LogData): LogData {
    const entries = Object.entries(data).map(([key, value]) => [
      key,
      LogSanitizer.field(key, value),
    ]);
    return Object.fromEntries(entries);
  }

  private static readonly maskers: Record<MaskedLogFieldKind, (text: string) => string> = {
    [LogFieldKind.Phone]: (text) => (LogPattern.MaskedPhone.test(text) ? text : Mask.phone(text)),
    [LogFieldKind.Email]: (text) =>
      LogPattern.MaskedEmail.test(text) ? LogSanitizer.text(text) : Mask.email(text),
    [LogFieldKind.Plain]: (text) => LogSanitizer.text(text),
  };

  private static field(key: string, value: LogData[string]): LogData[string] {
    const kind = LogSanitizer.kindOf(key);
    if (kind === LogFieldKind.Sensitive) return LogRedaction.SensitiveValue;

    const maskable =
      typeof value === "string" || (kind === LogFieldKind.Phone && typeof value === "number");
    return maskable ? LogSanitizer.maskers[kind](String(value)) : value;
  }

  private static kindOf(key: string): LogFieldKindValue {
    const normalizedKey = key.replace(LogPattern.CamelCaseBoundary, "$1_$2").toLowerCase();
    const rule = LogFieldRules.find(([, pattern]) => pattern.test(normalizedKey));
    return rule?.[0] ?? LogFieldKind.Plain;
  }
}
