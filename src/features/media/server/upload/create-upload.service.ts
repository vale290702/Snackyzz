import "server-only";

import { randomUUID } from "node:crypto";

import { createServiceClient } from "@/integrations/supabase/service-client";
import type { Logger } from "@/shared/lib/logger";
import { Results, type Result } from "@/shared/lib/result";

import { admitUpload } from "./upload-admission.service";
import { issueReceipt } from "./upload-receipt.service";
import type { UploaderId, UploadTicket } from "./upload.types";
import { MediaError, type MediaErrorCode } from "../../domain/errors";
import { ObjectPath, UPLOAD_POLICIES, type CreateUploadInput } from "../../domain/upload-policy";
import { mediaStorage } from "../storage";

/**
 * Issues a one-time upload URL for a server-generated path and remembers it for this browser.
 * @param input Validated claims about the file.
 * @param uploaderId The authorized admin, or null for a customer.
 * @param log The action's logger.
 * @returns Where to upload the file, or why the upload was refused.
 */
export async function issueUpload(
  input: CreateUploadInput,
  uploaderId: UploaderId,
  log: Logger,
): Promise<Result<UploadTicket, MediaErrorCode>> {
  const isAdmitted = await admitUpload();
  if (!isAdmitted) {
    return Results.err(MediaError.RateLimited);
  }
  log.step("admit");

  const { purpose, mimeType, sizeBytes } = input;
  const objectPath = ObjectPath.create(purpose, mimeType, new Date(), randomUUID());
  const storage = mediaStorage(createServiceClient());
  const upload = await storage.signUpload(UPLOAD_POLICIES[purpose].bucket, objectPath);
  if (!upload.ok) {
    return upload;
  }
  log.step("signUpload");

  await issueReceipt({ objectPath, purpose, mimeType, sizeBytes, uploaderId });
  log.step("issueReceipt");

  return Results.ok({ objectPath, ...upload.value });
}
