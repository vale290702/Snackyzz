import type { z } from "zod";

import type { settingsRowSchema } from "./settings.schema";

/**
 * Which methods checkout offers, how delivery windows are cut, and the zone schedules are in.
 */
export type FulfillmentSettings = z.output<typeof settingsRowSchema>;
