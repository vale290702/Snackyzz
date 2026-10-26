import type { CatalogImagePurpose } from "./images.constants";

/**
 * The upload purpose a catalog image column requires.
 */
export type CatalogImagePurposeValue =
  (typeof CatalogImagePurpose)[keyof typeof CatalogImagePurpose];
