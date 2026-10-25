import "server-only";

import { LogSanitizer } from "./log-sanitizer.helper";
import { LogLevel } from "./logger.constants";
import type { LogData, Logger, LogLevelValue } from "./logger.types";

function write(level: LogLevelValue, name: string, context: LogData, data: LogData): void {
  const record = {
    ...LogSanitizer.fields(data),
    ...LogSanitizer.fields(context),
    level,
    msg: LogSanitizer.text(name),
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
    info: (name, data = {}) => write(LogLevel.Info, name, bound, data),
    error: (name, data = {}) => write(LogLevel.Error, name, bound, data),
    step: (name, data = {}) => write(LogLevel.Info, name, bound, data),
  };
}

/**
 * Default server logger for diagnostics outside an action.
 */
export const logger = createLogger({});
