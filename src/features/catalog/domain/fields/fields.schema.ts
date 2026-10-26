import { z } from "zod";

import {
  ACCENT_COLOR_PATTERN,
  CatalogFieldError,
  INTEGER_MAX,
  SLUG_MAX_LENGTH,
  SLUG_PATTERN,
} from "./fields.constants";

/**
 * Field schemas shared by every catalog input. Issue messages are `CatalogFieldError` codes, and
 * limits mirror the SQL constraints so the database never sees a value Zod accepted wrongly.
 */
export class CatalogFields {
  private constructor() {}

  /**
   * A row id, such as a brand or product the input refers to.
   */
  static readonly id = z.uuid({ error: CatalogFieldError.ReferenceInvalid });

  /**
   * An optional `media.files` id; missing means no image.
   */
  static readonly fileId = z
    .uuid({ error: CatalogFieldError.ReferenceInvalid })
    .nullable()
    .default(null);

  /**
   * A URL segment, unique per table (per brand for products).
   */
  static readonly slug = z
    .string({ error: CatalogFieldError.SlugInvalid })
    .trim()
    .max(SLUG_MAX_LENGTH, { error: CatalogFieldError.TooLong })
    .regex(SLUG_PATTERN, { error: CatalogFieldError.SlugInvalid });

  /**
   * A `#RRGGBB` color for a product card.
   */
  static readonly accentColor = z
    .string({ error: CatalogFieldError.AccentColorInvalid })
    .trim()
    .regex(ACCENT_COLOR_PATTERN, { error: CatalogFieldError.AccentColorInvalid });

  /**
   * A price in whole colones, greater than zero; form text is coerced.
   */
  static readonly price = z.coerce
    .number({ error: CatalogFieldError.PriceInvalid })
    .int({ error: CatalogFieldError.PriceInvalid })
    .positive({ error: CatalogFieldError.PriceInvalid })
    .max(INTEGER_MAX, { error: CatalogFieldError.PriceInvalid });

  /**
   * Position in its list, lowest first; missing means zero.
   */
  static readonly sortOrder = z.coerce
    .number({ error: CatalogFieldError.SortOrderInvalid })
    .int({ error: CatalogFieldError.SortOrderInvalid })
    .min(0, { error: CatalogFieldError.SortOrderInvalid })
    .max(INTEGER_MAX, { error: CatalogFieldError.SortOrderInvalid })
    .default(0);

  /**
   * Text that must not be blank.
   * @param maxLength Longest length the column accepts.
   * @returns A schema that trims the text.
   */
  static requiredText(maxLength: number) {
    return z
      .string({ error: CatalogFieldError.Required })
      .trim()
      .min(1, { error: CatalogFieldError.Required })
      .max(maxLength, { error: CatalogFieldError.TooLong });
  }

  /**
   * Text that may be left out; blank text is stored as null, never as an empty string.
   * @param maxLength Longest length the column accepts.
   * @returns A schema that trims the text and turns blank or missing text into null.
   */
  static optionalText(maxLength: number) {
    return z
      .string({ error: CatalogFieldError.TooLong })
      .trim()
      .max(maxLength, { error: CatalogFieldError.TooLong })
      .nullish()
      .transform((text) => {
        if (text === undefined || text === null || text === "") {
          return null;
        }

        return text;
      });
  }
}

/**
 * Input that names one row, for archiving or making it the primary brand or default variant.
 */
export const recordIdInputSchema = z.object({ id: CatalogFields.id });
