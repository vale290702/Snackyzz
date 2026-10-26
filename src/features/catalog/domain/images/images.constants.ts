import type { FilePurpose } from "@/features/media";

/**
 * The upload purpose each catalog image column requires.
 */
export const CatalogImagePurpose = {
  ProductImage: "product_image",
  BrandLogo: "brand_logo",
} as const satisfies Record<string, FilePurpose>;
