/**
 * Placeholders used when diagnostic values must be withheld.
 */
export const LogRedaction = {
  SensitiveValue: "[REDACTED]",
  Url: "[REDACTED_URL]",
} as const;

/**
 * Unanchored patterns scan embedded text; field and masked-value patterns classify whole fields.
 * Global patterns are only used with replace, avoiding stateful test calls.
 */
export const LogPattern = {
  EmbeddedUrl: /https?:\/\/[^\s)]+/gi,
  EmbeddedEmail: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
  EmbeddedPhone: /(?<![\w-])\+?\d[\d ()-]{6,}\d(?![\w-])/g,
  SensitiveField: /token|secret|password|authorization|cookie|proof|api.?key/i,
  PhoneField: /phone/i,
  EmailField: /email/i,
  MaskedPhone: /^\*{4}\d{4}$/,
  MaskedEmail: /^(?:[^@\s])?\*{3}@[^@\s]+$/,
} as const;
