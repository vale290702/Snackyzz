import type { z } from "zod";

import type { SharedErrorCode } from "@/shared/lib/result";

import type { productRowSchema } from "./products.schema";
import type { CatalogErrorCode } from "../../domain/errors";

/**
 * A product as catalog management sees it, archived or not, with its category ids.
 */
export type Product = z.output<typeof productRowSchema>;

/**
 * A product the editor saved, and why its presentation was not saved when that step failed.
 */
export type SavedProduct = {
  product: Product;
  presentationError: CatalogErrorCode | SharedErrorCode | null;
};
