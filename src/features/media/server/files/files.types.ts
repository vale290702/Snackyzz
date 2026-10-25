import type { z } from "zod";

import type { filePurposeSchema, storedFileSchema } from "./files.schema";
import type { ImageMimeType, MediaBucketName, UploadPurpose } from "../../domain/upload-policy";

/**
 * Why a file was stored; one value of `media.file_purpose`.
 */
export type FilePurpose = z.output<typeof filePurposeSchema>;

/**
 * A registered file with where it lives in storage. Never returned to clients.
 */
export type StoredFile = z.output<typeof storedFileSchema>;

/**
 * What the rest of the app holds for a file: never a storage path or URL.
 */
export type FileRef = StoredFile["ref"];

/**
 * Metadata for an object that passed inspection.
 */
export type NewFile = {
  bucket: MediaBucketName;
  objectPath: string;
  purpose: UploadPurpose;
  mimeType: ImageMimeType;
  sizeBytes: number;
  width: number;
  height: number;
  sha256: string;
  uploadedBy: string | null;
};
