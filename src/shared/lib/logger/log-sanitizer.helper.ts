import { LogPattern, LogRedaction } from "./log-sanitizer.constants";
import type { LogData } from "./logger.types";
import { Mask } from "./mask.helper";

/**
 * Defensive redaction for explicitly selected diagnostic fields.
 */
export class LogSanitizer {
  private constructor() {}

  /**
   * Masks recognizable contacts and removes URLs in diagnostic text.
   * @param value Safe diagnostic text, never arbitrary secrets or user payloads.
   * @returns Text with common sensitive patterns concealed.
   */
  static text(value: string): string {
    return value
      .replace(LogPattern.EmbeddedUrl, LogRedaction.Url)
      .replace(LogPattern.EmbeddedEmail, (email) => Mask.email(email))
      .replace(LogPattern.EmbeddedPhone, (phone) => Mask.phone(phone));
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
    if (LogPattern.SensitiveField.test(key)) {
      return LogRedaction.SensitiveValue;
    }

    if (LogPattern.PhoneField.test(key)) {
      const text = String(value);
      return LogPattern.MaskedPhone.test(text) ? text : Mask.phone(text);
    }

    if (LogPattern.EmailField.test(key)) {
      const text = String(value);
      const masked = LogPattern.MaskedEmail.test(text);
      return masked ? LogSanitizer.text(text) : Mask.email(text);
    }

    return typeof value === "string" ? LogSanitizer.text(value) : value;
  }
}
