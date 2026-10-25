import { z } from "zod";

import { IMAGE_MIME_TYPES, uploadPurposeSchema } from "../../domain/upload-policy";

/**
 * What the server promised a browser when it issued an upload URL.
 */
export const uploadReceiptSchema = z.object({
  objectPath: z.string(),
  purpose: uploadPurposeSchema,
  mimeType: z.enum(IMAGE_MIME_TYPES),
  sizeBytes: z.int().positive(),
  uploaderId: z.uuid().nullable(),
  expiresAt: z.int(),
});
