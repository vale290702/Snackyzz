/**
 * Safe event job failures; raw handler/database messages never become receipt errors or logs.
 */
export const EventError = {
  InvalidConsumer: "invalid_consumer",
  InvalidEvent: "invalid_event",
  PendingReadFailed: "pending_read_failed",
  HandlerFailed: "handler_failed",
  ReceiptWriteFailed: "receipt_write_failed",
  KickFailed: "kick_failed",
} as const;

/**
 * Failure codes owned by events.
 */
export type EventErrorCode = (typeof EventError)[keyof typeof EventError];
