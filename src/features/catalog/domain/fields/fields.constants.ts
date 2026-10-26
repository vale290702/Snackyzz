/**
 * Field-level codes reported by catalog input schemas; copy lives in `errors.catalog`.
 */
export const CatalogFieldError = {
  Required: "field_required",
  TooLong: "field_too_long",
  SlugInvalid: "slug_invalid",
  AccentColorInvalid: "accent_color_invalid",
  PriceInvalid: "price_invalid",
  SortOrderInvalid: "sort_order_invalid",
  ReferenceInvalid: "reference_invalid",
} as const;

/**
 * Lowercase letters, digits and hyphens; mirrors the `*_slug_check` constraints.
 */
export const SLUG_PATTERN = /^[a-z0-9-]+$/;

/**
 * Longest slug the `*_slug_check` constraints accept.
 */
export const SLUG_MAX_LENGTH = 60;

/**
 * A `#RRGGBB` color; mirrors `products_accent_color_check`.
 */
export const ACCENT_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/**
 * Largest value a Postgres `integer` column holds, used for prices and sort orders.
 */
export const INTEGER_MAX = 2_147_483_647;
