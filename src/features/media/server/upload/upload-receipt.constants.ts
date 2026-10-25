/**
 * Matches the lifetime of Supabase signed upload tokens.
 * https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl
 */
export const RECEIPT_LIFETIME_SECONDS = 2 * 60 * 60;

/**
 * Bounds the Cookie header. Issuing a ninth receipt evicts the oldest pending upload.
 */
export const MAX_PENDING_RECEIPTS = 8;

/**
 * Prefix of receipt cookie names; the rest is a digest of the object path.
 */
export const RECEIPT_COOKIE_PREFIX = "media-upload-";

/**
 * Receipts are HMAC-signed JWTs; verification accepts no other algorithm.
 */
export const RECEIPT_ALGORITHM = "HS256";
