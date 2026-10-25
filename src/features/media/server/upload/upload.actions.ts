"use server";

import "server-only";

import { getAdminContext } from "@/features/access";
import { CapabilitySource } from "@/shared/lib/capability";
import { Results, SharedError, type SharedErrorCode } from "@/shared/lib/result";
import { runAction, type ActionResult } from "@/shared/lib/run-action";

import { issueUpload } from "./create-upload.service";
import { registerUpload } from "./register-upload.service";
import { createUploadCapabilities, registerUploadCapabilities } from "./upload.capability";
import { ANONYMOUS_UPLOADER } from "./upload.constants";
import type { UploadTicket } from "./upload.types";
import { MediaError, type MediaErrorCode } from "../../domain/errors";
import {
  createUploadInputSchema,
  registerUploadInputSchema,
  UPLOAD_POLICIES,
  uploadTargetSchema,
} from "../../domain/upload-policy";
import type { FileRef } from "../files";

/**
 * Issues a one-time URL to upload a file directly to storage. Customers may upload payment
 * proofs; other purposes need the permission their upload policy names.
 * @param input Untrusted `{ purpose, mimeType, sizeBytes }` from the file picker.
 * @returns Where to upload the file, or why the upload was refused.
 * @throws Redirects to sign-in when a staff purpose is requested without an admin session.
 */
export async function createUploadAction(
  input: unknown,
): Promise<ActionResult<UploadTicket, MediaErrorCode>> {
  return runAction<UploadTicket, MediaErrorCode | SharedErrorCode>(
    "media.createUpload",
    async (log) => {
      const target = uploadTargetSchema.safeParse(input);
      if (!target.success) {
        return Results.err(MediaError.UnsupportedPurpose);
      }

      const { permission } = UPLOAD_POLICIES[target.data.purpose];
      if (permission) {
        const context = await getAdminContext({ source: CapabilitySource.AdminWeb });
        return createUploadCapabilities[permission].run({ ...context, log }, input);
      }

      const parsed = createUploadInputSchema.safeParse(input);
      if (!parsed.success) {
        return Results.err(SharedError.InvalidInput);
      }

      return issueUpload(parsed.data, ANONYMOUS_UPLOADER, log);
    },
  );
}

/**
 * Registers a file uploaded with a URL from `createUploadAction`, after checking its bytes.
 * @param input Untrusted `{ purpose, objectPath }`.
 * @returns The registered file, or why it was rejected.
 * @throws Redirects to sign-in when a staff purpose is registered without an admin session.
 */
export async function registerUploadAction(
  input: unknown,
): Promise<ActionResult<FileRef, MediaErrorCode>> {
  return runAction<FileRef, MediaErrorCode | SharedErrorCode>(
    "media.registerUpload",
    async (log) => {
      const target = uploadTargetSchema.safeParse(input);
      if (!target.success) {
        return Results.err(MediaError.UnsupportedPurpose);
      }

      const { permission } = UPLOAD_POLICIES[target.data.purpose];
      if (permission) {
        const context = await getAdminContext({ source: CapabilitySource.AdminWeb });
        return registerUploadCapabilities[permission].run({ ...context, log }, input);
      }

      const parsed = registerUploadInputSchema.safeParse(input);
      if (!parsed.success) {
        return Results.err(SharedError.InvalidInput);
      }

      return registerUpload(parsed.data, ANONYMOUS_UPLOADER, log);
    },
  );
}
