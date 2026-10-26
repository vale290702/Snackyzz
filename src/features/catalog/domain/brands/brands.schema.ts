import { z } from "zod";

import { BrandTextLimit } from "./brands.constants";
import { CatalogFields } from "../fields";

/**
 * A brand's editable fields. Which brand is primary is changed on its own, never here.
 */
export const brandInputSchema = z.object({
  slug: CatalogFields.slug,
  name: CatalogFields.requiredText(BrandTextLimit.Name),
  tagline: CatalogFields.optionalText(BrandTextLimit.Tagline),
  description: CatalogFields.optionalText(BrandTextLimit.Description),
  label: CatalogFields.optionalText(BrandTextLimit.Label),
  logoFileId: CatalogFields.fileId,
  sortOrder: CatalogFields.sortOrder,
});

/**
 * A brand's editable fields with the brand they replace.
 */
export const updateBrandInputSchema = brandInputSchema.extend({ id: CatalogFields.id });
