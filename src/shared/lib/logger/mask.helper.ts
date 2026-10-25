import { ContactMask, ContactPattern } from "./mask.constants";
import { emailMaskSchema } from "./mask.schema";

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
    const parsed = emailMaskSchema.safeParse(value);
    if (!parsed.success) return ContactMask.Email;

    const separatorIndex = parsed.data.lastIndexOf("@");
    const local = parsed.data.slice(0, separatorIndex);
    const domain = parsed.data.slice(separatorIndex + 1);
    const prefix = local.length > 1 ? local.charAt(0) : "";
    return `${prefix}${ContactMask.Email}@${domain}`;
  }

  /**
   * Keeps only the last four digits of a longer phone number.
   * @param value Phone number to mask.
   * @returns A masked number; short or empty values are fully hidden.
   */
  static phone(value: string): string {
    const digits = value.replace(ContactPattern.NonDigit, "");
    if (digits.length <= ContactMask.VisiblePhoneDigits) return ContactMask.Phone;

    const suffix = digits.slice(-ContactMask.VisiblePhoneDigits);
    return `${ContactMask.Phone}${suffix}`;
  }
}
