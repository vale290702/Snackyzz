import "server-only";

import sharp from "sharp";

import { Results, type Result } from "@/shared/lib/result";

import type { UploadReceipt } from "./upload-receipt.types";
import type { ImageDimensions, InspectedImage } from "./upload.types";
import { MediaError, type MediaErrorCode } from "../../domain/errors";
import { ImageSignature, UPLOAD_POLICIES } from "../../domain/upload-policy";

/**
 * Checks an uploaded object against what its receipt promised, then decodes it fully.
 * @param receipt The claims the upload URL was issued for.
 * @param object The object downloaded from storage.
 * @returns The image's bytes and dimensions, or why it was rejected.
 */
export async function inspectUpload(
  receipt: UploadReceipt,
  object: Blob,
): Promise<Result<InspectedImage, MediaErrorCode>> {
  const policy = UPLOAD_POLICIES[receipt.purpose];
  if (object.size > policy.maxBytes) {
    return Results.err(MediaError.FileTooLarge);
  }

  if (object.size !== receipt.sizeBytes) {
    return Results.err(MediaError.InvalidUpload);
  }

  // Storage serves the object with the type the browser declared, so that must match as well.
  const bytes = Buffer.from(await object.arrayBuffer());
  const isPromisedType =
    ImageSignature.detect(bytes) === receipt.mimeType && object.type === receipt.mimeType;
  if (!isPromisedType) {
    return Results.err(MediaError.InvalidFileType);
  }

  const dimensions = await decodeImage(bytes, policy.maxPixels);
  if (!dimensions.ok) {
    return dimensions;
  }

  return Results.ok({ bytes, mimeType: receipt.mimeType, ...dimensions.value });
}

async function decodeImage(
  bytes: Buffer,
  maxPixels: number,
): Promise<Result<ImageDimensions, MediaErrorCode>> {
  try {
    // Header checks come first, so an oversized image is refused before any pixel is decoded.
    const image = sharp(bytes, { failOn: "warning" });
    const { width, height, pages = 1 } = await image.metadata();
    if (pages > 1) {
      return Results.err(MediaError.InvalidImage);
    }

    if (width * height > maxPixels) {
      return Results.err(MediaError.InvalidDimensions);
    }

    // A plausible header does not prove the pixel data is intact; only a full decode does.
    await image.stats();
    return Results.ok({ width, height });
  } catch {
    // libvips rejects truncated or corrupt data and decoder warnings.
    return Results.err(MediaError.InvalidImage);
  }
}
