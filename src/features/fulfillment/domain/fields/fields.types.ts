import type { z } from "zod";

import type { FulfillmentFieldError } from "./fields.constants";
import type { recordIdInputSchema } from "./fields.schema";

/**
 * A field-level fulfillment input code.
 */
export type FulfillmentFieldErrorCode =
  (typeof FulfillmentFieldError)[keyof typeof FulfillmentFieldError];

/**
 * Input that names one row.
 */
export type RecordIdInput = z.output<typeof recordIdInputSchema>;
