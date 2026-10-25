import { z } from "zod";

import { IMAGE_MIME_TYPES, uploadPurposeSchema } from "../../domain/upload-policy";

/**
 * A verified receipt token's claims; the subject is the object path the URL was issued for.
 */
export const uploadReceiptClaimsSchema = z
  .object({
    sub: z.string(),
    purpose: uploadPurposeSchema,
    mimeType: z.enum(IMAGE_MIME_TYPES),
    sizeBytes: z.int().positive(),
    uploaderId: z.uuid().nullable(),
  })
  .transform(({ sub, ...claims }) => ({ objectPath: sub, ...claims }));
