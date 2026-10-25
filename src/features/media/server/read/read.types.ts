import type { FileRef } from "../files";

/**
 * A product image or brand logo with its public URL.
 */
export type CatalogImage = {
  ref: FileRef;
  url: string;
};
