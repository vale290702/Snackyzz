/**
 * Field-level codes reported by fulfillment input schemas; copy lives in `errors.fulfillment`.
 */
export const FulfillmentFieldError = {
  Required: "field_required",
  TooLong: "field_too_long",
  ReferenceInvalid: "reference_invalid",
  SortOrderInvalid: "sort_order_invalid",
  MapUrlInvalid: "map_url_invalid",
  FeeInvalid: "fee_invalid",
  WeekdayInvalid: "weekday_invalid",
  TimeInvalid: "time_invalid",
  HoursInverted: "hours_inverted",
  HoursOverlap: "hours_overlap",
  TooManyHours: "too_many_hours",
  LeadHoursInvalid: "lead_hours_invalid",
  SlotHoursInvalid: "slot_hours_invalid",
  ToggleInvalid: "toggle_invalid",
} as const;

/**
 * Largest value a Postgres `integer` column holds, used for fees and sort orders.
 */
export const INTEGER_MAX = 2_147_483_647;

/**
 * Longest map link; mirrors `pickup_locations_map_url_check`, which also requires https.
 */
export const MAP_URL_MAX_LENGTH = 500;

/**
 * A wall-clock time as `HH:MM`, 00:00 to 23:59.
 */
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
