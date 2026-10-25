import type { z } from "zod";

import type { brandRowSchema } from "./brands.schema";

/**
 * A brand as catalog management sees it, archived or not.
 */
export type Brand = z.output<typeof brandRowSchema>;
