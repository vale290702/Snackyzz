import { z } from "zod";

import { IMAGE_MIME_TYPES, UPLOAD_POLICIES, UPLOAD_PURPOSES } from "./upload-policy.constants";
import { MediaError } from "../errors";

/**
 * A purpose that can be uploaded; anything else reports `unsupported_purpose`.
 */
export const uploadPurposeSchema = z.enum(UPLOAD_PURPOSES, {
  error: MediaError.UnsupportedPurpose,
});

/**
 * Reads only the purpose, so an action can pick who must authorize the rest of the input.
 */
export const uploadTargetSchema = z.object({ purpose: uploadPurposeSchema });

/**
 * What the browser claims about a file before uploading it; the bytes are checked at registration.
 * Issue messages are `MediaError` codes so a file picker can show them before anything is sent.
 */
export const createUploadInputSchema = z
  .object({
    purpose: uploadPurposeSchema,
    mimeType: z.enum(IMAGE_MIME_TYPES, { error: MediaError.InvalidFileType }),
    sizeBytes: z.int().positive({ error: MediaError.FileTooLarge }),
  })
  .superRefine(({ purpose, mimeType, sizeBytes }, context) => {
    const policy = UPLOAD_POLICIES[purpose];

    if (!policy.mimeTypes.includes(mimeType)) {
      context.addIssue({ code: "custom", path: ["mimeType"], message: MediaError.InvalidFileType });
    }

    if (sizeBytes > policy.maxBytes) {
      context.addIssue({ code: "custom", path: ["sizeBytes"], message: MediaError.FileTooLarge });
    }
  });

/**
 * An object the browser uploaded with a URL from `createUploadAction`.
 */
export const registerUploadInputSchema = z.object({
  purpose: uploadPurposeSchema,
  objectPath: z.string().min(1),
});
