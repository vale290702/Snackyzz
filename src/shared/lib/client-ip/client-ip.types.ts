/**
 * How to treat a request without a trusted client IP.
 */
export type ClientIpOptions = {
  /**
   * True outside production: fall back to loopback instead of failing.
   */
  allowLoopbackFallback: boolean;
};
