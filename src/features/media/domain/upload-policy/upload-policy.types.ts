import type { z } from "zod";

import type {
  FilePurpose,
  ImageMime,
  MediaBucket,
  UPLOAD_PURPOSES,
  UploadPermission,
} from "./upload-policy.constants";
import type { createUploadInputSchema, registerUploadInputSchema } from "./upload-policy.schema";

/**
 * Any value of `media.file_purpose`.
 */
export type FilePurposeValue = (typeof FilePurpose)[keyof typeof FilePurpose];

/**
 * A purpose that can be uploaded today.
 */
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

/**
 * An accepted image format.
 */
export type ImageMimeType = (typeof ImageMime)[keyof typeof ImageMime];

/**
 * A provisioned storage bucket.
 */
export type MediaBucketName = (typeof MediaBucket)[keyof typeof MediaBucket];

/**
 * A permission that guards a staff upload.
 */
export type UploadPermissionValue = (typeof UploadPermission)[keyof typeof UploadPermission];

/**
 * Storage, access and image rules for one purpose.
 */
export type UploadPolicy = {
  bucket: MediaBucketName;
  /**
   * Null when anyone may upload, as customers do for payment proofs.
   */
  permission: UploadPermissionValue | null;
  mimeTypes: readonly ImageMimeType[];
  maxBytes: number;
  maxPixels: number;
};

/**
 * A validated request for an upload URL.
 */
export type CreateUploadInput = z.output<typeof createUploadInputSchema>;

/**
 * A validated request to register an uploaded object.
 */
export type RegisterUploadInput = z.output<typeof registerUploadInputSchema>;
