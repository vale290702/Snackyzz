import { ContactMask } from "./mask.constants";

/**
 * Stateless contact masking helpers for explicitly selected diagnostic fields.
 */
export class Mask {
  private constructor() {}

  /**
   * Hides the local part, retaining a first character only when more than one exists.
   * @param value Email address to mask.
   * @returns A masked address, or a fully hidden malformed value.
   */
  static email(value: string): string {
    const match = /^([^@\s]+)@([^@\s]+\.[^@\s]+)$/.exec(value);
    if (!match) return ContactMask.Email;

    const local = match[1] ?? "";
    const prefix = local.length > 1 ? local.charAt(0) : "";
    return `${prefix}${ContactMask.Email}@${match[2]}`;
  }

  /**
   * Keeps only the last four digits of a longer phone number.
   * @param value Phone number to mask.
   * @returns A masked number; short or empty values are fully hidden.
   */
  static phone(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= ContactMask.VisiblePhoneDigits) return ContactMask.Phone;

    const suffix = digits.slice(-ContactMask.VisiblePhoneDigits);
    return `${ContactMask.Phone}${suffix}`;
  }
}
