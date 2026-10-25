import { IMAGE_EXTENSION } from "./upload-policy.constants";
import type { ImageMimeType, UploadPurpose } from "./upload-policy.types";

/**
 * Storage keys built only from server-supplied values; client file names never reach a path.
 */
export class ObjectPath {
  private constructor() {}

  /**
   * Builds `<purpose>/<yyyy>/<mm>/<id>.<ext>`, dated in UTC.
   * @param purpose The upload's purpose.
   * @param mimeType The validated image format.
   * @param uploadedAt The server clock.
   * @param id A server-generated UUID.
   * @returns The object's storage key.
   */
  static create(
    purpose: UploadPurpose,
    mimeType: ImageMimeType,
    uploadedAt: Date,
    id: string,
  ): string {
    const year = String(uploadedAt.getUTCFullYear());
    const month = String(uploadedAt.getUTCMonth() + 1).padStart(2, "0");
    const fileName = `${id}.${IMAGE_EXTENSION[mimeType]}`;

    return [purpose, year, month, fileName].join("/");
  }
}
