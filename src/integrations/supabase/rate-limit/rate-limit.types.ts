import type { RateLimitError } from "./rate-limit.constants";

/**
 * A fixed-window limit for one caller-owned key.
 */
export type RateLimitRule = {
  /**
   * Opaque and scoped by the caller, e.g. `media-upload:<hmac>`; at most 128 characters.
   */
  key: string;
  maxRequests: number;
  windowSeconds: number;
};

/**
 * Whether this request fit in the current window.
 */
export type RateLimitDecision = {
  admitted: boolean;
};

/**
 * A limiter failure.
 */
export type RateLimitErrorCode = (typeof RateLimitError)[keyof typeof RateLimitError];
