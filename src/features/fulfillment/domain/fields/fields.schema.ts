import { z } from "zod";

import {
  FulfillmentFieldError,
  INTEGER_MAX,
  MAP_URL_MAX_LENGTH,
  TIME_PATTERN,
} from "./fields.constants";

const HTTPS_PROTOCOL = /^https$/;

/**
 * Field schemas shared by every fulfillment input. Issue messages are `FulfillmentFieldError`
 * codes, and limits mirror the SQL constraints so the database never sees a value Zod accepted.
 */
export class FulfillmentFields {
  private constructor() {}

  /**
   * A row id, such as the pickup location or delivery zone the input refers to.
   */
  static readonly id = z.uuid({ error: FulfillmentFieldError.ReferenceInvalid });

  /**
   * Position in its list, lowest first; missing means zero.
   */
  static readonly sortOrder = z.coerce
    .number({ error: FulfillmentFieldError.SortOrderInvalid })
    .int({ error: FulfillmentFieldError.SortOrderInvalid })
    .min(0, { error: FulfillmentFieldError.SortOrderInvalid })
    .max(INTEGER_MAX, { error: FulfillmentFieldError.SortOrderInvalid })
    .default(0);

  /**
   * An optional https link to a map; blank or missing means none.
   */
  static readonly mapUrl = z
    .string({ error: FulfillmentFieldError.MapUrlInvalid })
    .trim()
    .max(MAP_URL_MAX_LENGTH, { error: FulfillmentFieldError.TooLong })
    .nullish()
    .transform(FulfillmentFields.blankToNull)
    .pipe(
      z.url({ protocol: HTTPS_PROTOCOL, error: FulfillmentFieldError.MapUrlInvalid }).nullable(),
    );

  /**
   * A delivery fee in whole colones; zero means free delivery. Form text is coerced.
   */
  static readonly fee = z.coerce
    .number({ error: FulfillmentFieldError.FeeInvalid })
    .int({ error: FulfillmentFieldError.FeeInvalid })
    .min(0, { error: FulfillmentFieldError.FeeInvalid })
    .max(INTEGER_MAX, { error: FulfillmentFieldError.FeeInvalid });

  /**
   * An ISO weekday: 1 is Monday, 7 is Sunday.
   */
  static readonly weekday = z.coerce
    .number({ error: FulfillmentFieldError.WeekdayInvalid })
    .int({ error: FulfillmentFieldError.WeekdayInvalid })
    .min(1, { error: FulfillmentFieldError.WeekdayInvalid })
    .max(7, { error: FulfillmentFieldError.WeekdayInvalid });

  /**
   * A wall-clock time as `HH:MM`.
   */
  static readonly time = z
    .string({ error: FulfillmentFieldError.TimeInvalid })
    .trim()
    .regex(TIME_PATTERN, { error: FulfillmentFieldError.TimeInvalid });

  /**
   * An on/off switch.
   */
  static readonly toggle = z.boolean({ error: FulfillmentFieldError.ToggleInvalid });

  /**
   * Text that must not be blank.
   * @param maxLength Longest length the column accepts.
   * @returns A schema that trims the text.
   */
  static requiredText(maxLength: number) {
    return z
      .string({ error: FulfillmentFieldError.Required })
      .trim()
      .min(1, { error: FulfillmentFieldError.Required })
      .max(maxLength, { error: FulfillmentFieldError.TooLong });
  }

  /**
   * Text that may be left out; blank text is stored as null, never as an empty string.
   * @param maxLength Longest length the column accepts.
   * @returns A schema that trims the text and turns blank or missing text into null.
   */
  static optionalText(maxLength: number) {
    return z
      .string({ error: FulfillmentFieldError.TooLong })
      .trim()
      .max(maxLength, { error: FulfillmentFieldError.TooLong })
      .nullish()
      .transform(FulfillmentFields.blankToNull);
  }

  /**
   * A whole number of hours within a range.
   * @param min Fewest hours allowed.
   * @param max Most hours allowed.
   * @param error The code reported for anything else.
   * @returns A schema that coerces form text.
   */
  static hours(min: number, max: number, error: string) {
    return z.coerce.number({ error }).int({ error }).min(min, { error }).max(max, { error });
  }

  private static blankToNull(text: string | null | undefined): string | null {
    if (text === undefined || text === null || text === "") {
      return null;
    }

    return text;
  }
}

/**
 * Input that names one row, for archiving it.
 */
export const recordIdInputSchema = z.object({ id: FulfillmentFields.id });
