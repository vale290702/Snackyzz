/**
 * Contact placeholders and retained suffix length.
 */
export const ContactMask = {
  Email: "***",
  Phone: "****",
  VisiblePhoneDigits: 4,
} as const;

/**
 * Character cleanup for formatted phone numbers before masking.
 */
export const ContactPattern = {
  NonDigit: /\D/g,
} as const;
