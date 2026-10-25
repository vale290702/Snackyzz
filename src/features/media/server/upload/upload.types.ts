import type { AdminContext } from "@/features/access";
import type { Logger } from "@/shared/lib/logger";

import type { ImageMimeType } from "../../domain/upload-policy";
import type { SignedUpload } from "../storage";

/**
 * Where and how the browser uploads its file.
 */
export type UploadTicket = SignedUpload & {
  objectPath: string;
};

/**
 * The admin who uploads, or null for a customer.
 */
export type UploaderId = string | null;

/**
 * Context for upload capabilities: the admin context plus the action's logger.
 */
export type UploadContext = AdminContext & {
  log: Logger;
};

/**
 * Decoded dimensions of an image.
 */
export type ImageDimensions = {
  width: number;
  height: number;
};

/**
 * An uploaded image that matched its receipt and decoded cleanly.
 */
export type InspectedImage = ImageDimensions & {
  bytes: Buffer;
  mimeType: ImageMimeType;
};
