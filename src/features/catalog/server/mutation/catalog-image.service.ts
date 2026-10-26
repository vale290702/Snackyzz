import "server-only";

import { findCatalogImages } from "@/features/media";
import { Results, type Result } from "@/shared/lib/result";

import { CatalogError } from "../../domain/errors";
import type { CatalogImagePurposeValue } from "../../domain/images";

type InvalidImage = typeof CatalogError.InvalidImage;

/**
 * Checks that a file id names an uploaded image of the purpose its column requires. The database
 * enforces the same rule; checking first gives the admin a clear error.
 * @param fileId The file to attach, or null for no image.
 * @param purpose The purpose the column requires.
 * @returns Success for null or a matching image; `invalid_image` otherwise.
 * @throws When the media lookup fails.
 */
export async function verifyCatalogImage(
  fileId: string | null,
  purpose: CatalogImagePurposeValue,
): Promise<Result<null, InvalidImage>> {
  if (fileId === null) {
    return Results.ok(null);
  }

  const images = await findCatalogImages([fileId]);
  if (images.get(fileId)?.ref.purpose !== purpose) {
    return Results.err(CatalogError.InvalidImage);
  }

  return Results.ok(null);
}
