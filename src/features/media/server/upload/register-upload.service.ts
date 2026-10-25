import "server-only";

import { createHash } from "node:crypto";

import { createServiceClient } from "@/integrations/supabase/service-client";
import type { Logger } from "@/shared/lib/logger";
import { Results, type Result } from "@/shared/lib/result";

import { inspectUpload } from "./image-inspection.service";
import { readReceipt } from "./upload-receipt.service";
import type { UploaderId } from "./upload.types";
import { MediaError, type MediaErrorCode } from "../../domain/errors";
import { UPLOAD_POLICIES, type RegisterUploadInput } from "../../domain/upload-policy";
import { filesRepository, type FileRef } from "../files";
import { mediaStorage } from "../storage";

/**
 * Registers an uploaded object after checking it against this browser's receipt. Rejected
 * objects are deleted.
 * @param input The purpose and object path the browser uploaded to.
 * @param uploaderId The authorized admin, or null for a customer.
 * @param log The action's logger.
 * @returns The registered file, or why it was rejected.
 * @throws When a rejected object cannot be deleted.
 */
export async function registerUpload(
  input: RegisterUploadInput,
  uploaderId: UploaderId,
  log: Logger,
): Promise<Result<FileRef, MediaErrorCode>> {
  const receipt = await readReceipt(input.objectPath);
  if (!receipt || receipt.purpose !== input.purpose || receipt.uploaderId !== uploaderId) {
    return Results.err(MediaError.InvalidUpload);
  }
  log.step("verifyReceipt");

  const { bucket } = UPLOAD_POLICIES[receipt.purpose];
  const client = createServiceClient();
  const storage = mediaStorage(client);
  const object = await storage.download(bucket, receipt.objectPath);
  if (!object.ok) {
    return object;
  }

  const inspection = await inspectUpload(receipt, object.value);
  if (!inspection.ok) {
    await storage.remove(bucket, receipt.objectPath);
    log.step("deleteRejectedObject", { error: inspection.error });
    return inspection;
  }
  log.step("inspect");

  const image = inspection.value;
  const file = await filesRepository(client).insertOnce({
    bucket,
    objectPath: receipt.objectPath,
    purpose: receipt.purpose,
    mimeType: image.mimeType,
    sizeBytes: image.bytes.length,
    width: image.width,
    height: image.height,
    sha256: createHash("sha256").update(image.bytes).digest("hex"),
    uploadedBy: uploaderId,
  });
  log.step("register");

  return Results.ok(file.ref);
}
