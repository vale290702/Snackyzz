import { z } from "zod";

import { Constants } from "@/integrations/supabase/database.types";

/**
 * A value of `media.file_purpose`, from the generated enum.
 */
export const filePurposeSchema = z.enum(Constants.media.Enums.file_purpose);

/**
 * Parses a `media.files` row, keeping where the object lives apart from what callers may see.
 */
export const storedFileSchema = z
  .object({
    id: z.uuid(),
    purpose: filePurposeSchema,
    mime_type: z.string(),
    size_bytes: z.int().positive(),
    width: z.int().positive().nullable(),
    height: z.int().positive().nullable(),
    bucket: z.string(),
    object_path: z.string(),
  })
  .transform((row) => ({
    ref: {
      id: row.id,
      purpose: row.purpose,
      mimeType: row.mime_type,
      sizeBytes: row.size_bytes,
      width: row.width,
      height: row.height,
    },
    location: {
      bucket: row.bucket,
      objectPath: row.object_path,
    },
  }));
