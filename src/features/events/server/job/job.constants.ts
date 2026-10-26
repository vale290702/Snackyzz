/**
 * Shared transport contract for the event composition root and after() kick.
 */
export const EVENT_JOB_PATH = "/api/jobs/events";

/**
 * A kick must not hold an after() callback open indefinitely.
 */
export const EVENT_KICK_TIMEOUT_MS = 10_000;

/**
 * HTTP outcomes for the event job; failures are safe to retry.
 */
export const EventJobStatus = {
  Ok: 200,
  Unauthorized: 401,
  Unavailable: 503,
} as const;
