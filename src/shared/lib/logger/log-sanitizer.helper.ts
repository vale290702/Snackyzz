import { LogPattern, LogRedaction } from "./log-sanitizer.constants";
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

  private static field(key: string, value: LogData[string]): LogData[string] {
    const normalizedKey = key.replace(LogPattern.CamelCaseBoundary, "$1_$2").toLowerCase();
    if (LogPattern.SensitiveField.test(normalizedKey)) {
      return LogRedaction.SensitiveValue;
    }

    if (typeof value === "number") {
      return LogPattern.PhoneField.test(normalizedKey) ? Mask.phone(String(value)) : value;
    }
    if (typeof value !== "string") return value;

    if (LogPattern.PhoneField.test(normalizedKey)) {
      return LogPattern.MaskedPhone.test(value) ? value : Mask.phone(value);
    }

    if (LogPattern.EmailField.test(normalizedKey)) {
      return LogPattern.MaskedEmail.test(value) ? LogSanitizer.text(value) : Mask.email(value);
    }

    return LogSanitizer.text(value);
  }
}
