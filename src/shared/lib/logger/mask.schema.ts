import { z } from "zod";

/**
 * Whole-email validation before retaining any portion of a diagnostic address.
 */
export const emailMaskSchema = z.email();
