import type { z } from "zod";

import type { productRowSchema } from "./products.schema";

/**
 * A product as catalog management sees it, archived or not, with its category ids.
 */
export type Product = z.output<typeof productRowSchema>;
