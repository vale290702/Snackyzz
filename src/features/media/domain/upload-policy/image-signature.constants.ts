import type { ImageSignatureDefinition } from "./image-signature.types";
import { ImageMime } from "./upload-policy.constants";

/**
 * Leading bytes that identify each accepted format (WHATWG MIME Sniffing, "image type pattern").
 */
export const IMAGE_SIGNATURES: readonly ImageSignatureDefinition[] = [
  {
    mimeType: ImageMime.Jpeg,
    markers: [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  },
  {
    mimeType: ImageMime.Png,
    markers: [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  },
  {
    mimeType: ImageMime.Webp,
    markers: [
      { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF", then a 4-byte chunk size
      { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50, 0x56, 0x50] }, // "WEBPVP"
    ],
  },
];
