import { z } from "zod";

import { InventoryFieldError, STOCK_NOTE_MAX_LENGTH, STOCK_QUANTITY_MAX } from "./stock.constants";

const reference = z.uuid({ error: InventoryFieldError.ReferenceInvalid });
const quantity = z
  .union([z.number(), z.string().trim().min(1).transform(Number)], {
    error: InventoryFieldError.QuantityInvalid,
  })
  .pipe(
    z
      .number({ error: InventoryFieldError.QuantityInvalid })
      .int({ error: InventoryFieldError.QuantityInvalid })
      .min(0, { error: InventoryFieldError.QuantityInvalid })
      .max(STOCK_QUANTITY_MAX, { error: InventoryFieldError.QuantityInvalid }),
  );

/**
 * Set-to adjustment input; the database computes the delta while holding its lock.
 */
export const adjustStockInputSchema = z.object({
  variantId: reference,
  pickupLocationId: reference.nullish().transform((value) => value ?? null),
  quantity,
  note: z
    .string({ error: InventoryFieldError.NoteTooLong })
    .trim()
    .max(STOCK_NOTE_MAX_LENGTH, { error: InventoryFieldError.NoteTooLong })
    .nullish()
    .transform((value) => value || null),
});

/**
 * A stock pool reference for the ledger read.
 */
export const stockLevelInputSchema = z.object({ stockLevelId: reference });

/**
 * Public availability arguments, bounded by the API response limit.
 */
export const availabilityInputSchema = z.object({
  variantIds: z.array(reference).max(1000),
  pickupLocationId: reference.nullish().transform((value) => value ?? null),
});
