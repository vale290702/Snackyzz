import { IMAGE_SIGNATURES } from "./image-signature.constants";
import type { SignatureMarker } from "./image-signature.types";
import type { ImageMimeType } from "./upload-policy.types";

/**
 * Identifies an image by its content, never by its file name or declared type.
 */
export class ImageSignature {
  private constructor() {}

  /**
   * Detects the format from the file's leading bytes. This is a cheap gate that keeps other
   * formats (SVG, TIFF, HEIF…) away from the image decoder; it does not prove the file is intact.
   * @param bytes The uploaded file.
   * @returns The accepted format the bytes start with, or null.
   */
  static detect(bytes: Uint8Array): ImageMimeType | null {
    const match = IMAGE_SIGNATURES.find(({ markers }) =>
      markers.every((marker) => ImageSignature.hasMarker(bytes, marker)),
    );

    return match?.mimeType ?? null;
  }

  private static hasMarker(bytes: Uint8Array, marker: SignatureMarker): boolean {
    return marker.bytes.every((expected, index) => bytes[marker.offset + index] === expected);
  }
}
