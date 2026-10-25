import type { ImageMimeType } from "./upload-policy.types";

/**
 * Bytes expected at a fixed position in a file.
 */
export type SignatureMarker = {
  offset: number;
  bytes: readonly number[];
};

/**
 * Every marker an image format's file must contain.
 */
export type ImageSignatureDefinition = {
  mimeType: ImageMimeType;
  markers: readonly SignatureMarker[];
};
