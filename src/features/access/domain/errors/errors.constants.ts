/**
 * Expected failures of the access feature; copy lives in `errors.access`.
 */
export const AccessError = {
  InvalidCredentials: "invalid_credentials",
  TooManyAttempts: "too_many_attempts",
  SignOutFailed: "sign_out_failed",
} as const;

/**
 * An expected access failure.
 */
export type AccessErrorCode = (typeof AccessError)[keyof typeof AccessError];
