import "server-only";

/** Flat, explicitly selected diagnostic fields; never pass request or provider payloads. */
export type LogData = Readonly<Record<string, string | number | boolean | null>>;

/** Structured server diagnostics with an operation's bound context. */
export type Logger = {
  info: (name: string, data?: LogData) => void;
  error: (name: string, data?: LogData) => void;
  step: (name: string, data?: LogData) => void;
};

/** Contact masking helpers for explicitly selected diagnostic fields. */
export const mask = {
  /**
   * Hides the local part, retaining a first character only when more than one exists.
   * @param value Email address to mask.
   * @returns A masked address, or a fully hidden malformed value.
   */
  email(value: string): string {
    const match = /^([^@\s]+)@([^@\s]+\.[^@\s]+)$/.exec(value);
    if (!match) return "***";

    const local = match[1] ?? "";
    const prefix = local.length > 1 ? local.charAt(0) : "";
    return `${prefix}***@${match[2]}`;
  },

  /**
   * Keeps only the last four digits of a longer phone number.
   * @param value Phone number to mask.
   * @returns A masked number; short or empty values are fully hidden.
   */
  phone(value: string): string {
    const digits = value.replace(/\D/g, "");
    return digits.length > 4 ? `****${digits.slice(-4)}` : "****";
  },
};

function sanitizeText(value: string): string {
  return value
    .replace(/https?:\/\/[^\s)]+/gi, "[REDACTED_URL]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (email) => mask.email(email))
    .replace(/(?<![\w-])\+?\d[\d ()-]{6,}\d(?![\w-])/g, (phone) => mask.phone(phone));
}

function sanitize(data: LogData): LogData {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (/token|secret|password|authorization|cookie|proof|api.?key/i.test(key)) {
        return [key, "[REDACTED]"];
      }

      if (/phone/i.test(key)) {
        const text = String(value);
        return [key, /^\*{4}\d{4}$/.test(text) ? text : mask.phone(text)];
      }

      if (/email/i.test(key)) {
        const text = String(value);
        const masked = /^(?:[^@\s])?\*{3}@[^@\s]+$/.test(text);
        return [key, masked ? sanitizeText(text) : mask.email(text)];
      }

      return [key, typeof value === "string" ? sanitizeText(value) : value];
    }),
  );
}

function write(level: string, name: string, context: LogData, data: LogData): void {
  const record = {
    ...sanitize(data),
    ...sanitize(context),
    level,
    msg: sanitizeText(name),
    timestamp: new Date().toISOString(),
  };

  // Why: this private transport is the sole console boundary; providers can replace it later.
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(record));
}

/**
 * Binds trusted diagnostic context to each structured log entry.
 * @param context Explicit safe fields, never secrets or raw request/provider payloads.
 * @returns A logger writing JSON lines through the private stdout transport.
 */
export function createLogger(context: LogData): Logger {
  const bound = { ...context };
  return {
    info: (name, data = {}) => write("info", name, bound, data),
    error: (name, data = {}) => write("error", name, bound, data),
    step: (name, data = {}) => write("info", name, bound, data),
  };
}

/** Default server logger for diagnostics outside an action. */
export const logger = createLogger({});
