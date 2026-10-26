import type { z } from "zod";

import type { CatalogFieldError } from "./fields.constants";
import type { recordIdInputSchema } from "./fields.schema";

/**
 * A field-level code from a catalog input schema.
 */
export type CatalogFieldErrorCode = (typeof CatalogFieldError)[keyof typeof CatalogFieldError];

/**
 * A validated reference to one row.
 */
export type RecordIdInput = z.output<typeof recordIdInputSchema>;
