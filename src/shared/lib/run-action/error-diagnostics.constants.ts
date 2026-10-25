/**
 * Bounded diagnostic identifiers; arbitrary messages and provider payloads are never included.
 */
export const ErrorDiagnostic = {
  UnknownName: "UnknownError",
  NamePattern: /^(?:[A-Za-z][A-Za-z0-9]{0,48})?(?:Error|Exception)$/,
  SqlStatePattern: /^[0-9A-Z]{5}$/,
} as const;
