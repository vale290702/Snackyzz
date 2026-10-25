/**
 * Vercel overwrites this header with the connecting client's IP, so callers cannot spoof it.
 * `x-forwarded-for` and `x-real-ip` are client-controlled and never read.
 * https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for
 */
export const TRUSTED_CLIENT_IP_HEADER = "x-vercel-forwarded-for";

/**
 * Stand-in client for local development, where no proxy sets the trusted header.
 */
export const LOOPBACK_IP = "127.0.0.1";
