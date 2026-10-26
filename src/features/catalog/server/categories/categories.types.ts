import type { z } from "zod";

import type { categoryRowSchema } from "./categories.schema";

/**
 * A category as catalog management sees it, archived or not.
 */
export type Category = z.output<typeof categoryRowSchema>;
