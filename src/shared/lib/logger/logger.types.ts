import type { LogLevel } from "./logger.constants";

/**
 * Flat, explicitly selected diagnostic fields; never request or provider payloads.
 */
export type LogData = Readonly<Record<string, string | number | boolean | null>>;

/**
 * Severity accepted by the logger transport.
 */
export type LogLevelValue = (typeof LogLevel)[keyof typeof LogLevel];

/**
 * Structured server diagnostics with an operation's bound context.
 */
export type Logger = {
  info: (name: string, data?: LogData) => void;
  error: (name: string, data?: LogData) => void;
  step: (name: string, data?: LogData) => void;
};
