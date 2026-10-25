import { LogRedaction } from "./log-sanitizer.constants";
import type { LogData } from "./logger.types";
import { Mask } from "./mask";

/** Defensive redaction for explicitly selected diagnostic fields. */
export class LogSanitizer {
  private constructor() {}

  /**
   * Masks recognizable contacts and removes URLs in diagnostic text.
   * @param value Safe diagnostic text, never arbitrary secrets or user payloads.
   * @returns Text with common sensitive patterns concealed.
   */
  static text(value: string): string {
    return value
      .replace(/https?:\/\/[^\s)]+/gi, LogRedaction.Url)
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (email) => Mask.email(email))
      .replace(/(?<![\w-])\+?\d[\d ()-]{6,}\d(?![\w-])/g, (phone) => Mask.phone(phone));
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
    if (/token|secret|password|authorization|cookie|proof|api.?key/i.test(key)) {
      return LogRedaction.SensitiveValue;
    }

    if (/phone/i.test(key)) {
      const text = String(value);
      return /^\*{4}\d{4}$/.test(text) ? text : Mask.phone(text);
    }

    if (/email/i.test(key)) {
      const text = String(value);
      const masked = /^(?:[^@\s])?\*{3}@[^@\s]+$/.test(text);
      return masked ? LogSanitizer.text(text) : Mask.email(text);
    }

    return typeof value === "string" ? LogSanitizer.text(value) : value;
  }
}
