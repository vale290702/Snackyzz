/**
 * Upload URLs each client IP may request in a fixed window.
 */
export const UPLOAD_RATE_LIMIT = {
  maxRequests: 20,
  windowSeconds: 10 * 60,
} as const;

/**
 * Scopes upload keys in the shared `private.rate_limits` table.
 */
export const UPLOAD_RATE_KEY_PREFIX = "media-upload:";

/**
 * The uploader recorded for customers, who have no admin account.
 */
export const ANONYMOUS_UPLOADER = null;
