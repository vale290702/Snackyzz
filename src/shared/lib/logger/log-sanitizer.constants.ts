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
  CamelCaseBoundary: /([a-z0-9])([A-Z])/g,
  SensitiveField:
    /(?:^|_)(?:token|secret|password|authorization|cookies?|proof(?:_url)?|api_?key)$/,
  PhoneField: /(?:^|_)phone$/,
  EmailField: /(?:^|_)email$/,
  MaskedPhone: /^\*{4}\d{4}$/,
  MaskedEmail: /^(?:[^@\s])?\*{3}@[^@\s]+$/,
} as const;
