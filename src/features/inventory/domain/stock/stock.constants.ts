/**
 * Codes for invalid inventory input fields.
 */
export const InventoryFieldError = {
  ReferenceInvalid: "reference_invalid",
  QuantityInvalid: "quantity_invalid",
  NoteTooLong: "note_too_long",
} as const;

/**
 * PostgreSQL integer limit shared by quantity inputs and output schemas.
 */
export const STOCK_QUANTITY_MAX = 2147483647;

/**
 * Maximum ledger note length.
 */
export const STOCK_NOTE_MAX_LENGTH = 500;
