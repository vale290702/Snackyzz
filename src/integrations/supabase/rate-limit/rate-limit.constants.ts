/**
 * Why the limiter could not answer. Callers must deny admission on either.
 */
export const RateLimitError = {
  Retryable: "retryable",
  Permanent: "permanent",
} as const;
