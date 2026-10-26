import type { z } from "zod";

import type { updateSettingsInputSchema } from "./settings.schema";

/**
 * A validated settings edit.
 */
export type UpdateSettingsInput = z.output<typeof updateSettingsInputSchema>;
