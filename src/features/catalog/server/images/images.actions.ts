"use server";

import "server-only";

import { z } from "zod";

import {
  createUploadAction,
  registerUploadAction,
  type FileRef,
  type MediaErrorCode,
  type UploadTicket,
} from "@/features/media";
import { Results } from "@/shared/lib/result";
import type { ActionResult } from "@/shared/lib/run-action";

import { CatalogImagePurpose } from "../mutation";

const UNSUPPORTED_PURPOSE: MediaErrorCode = "unsupported_purpose";

const catalogImageTargetSchema = z.object({
  purpose: z.enum(Object.values(CatalogImagePurpose)),
});

/**
 * Issues a one-time URL to upload a product image or brand logo. Catalog screens call this rather
 * than media's action, so the browser bundle never imports media's server-only reads.
 * @param input Untrusted `{ purpose, mimeType, sizeBytes }`; only catalog purposes are accepted.
 * @returns Where to upload the image, or why the upload was refused.
 * @throws Redirects to sign-in without an admin session.
 */
export async function createCatalogImageUploadAction(
  input: unknown,
): Promise<ActionResult<UploadTicket, MediaErrorCode>> {
  if (!catalogImageTargetSchema.safeParse(input).success) {
    return Results.err(UNSUPPORTED_PURPOSE);
  }

  return createUploadAction(input);
}

/**
 * Registers a product image or brand logo uploaded with a URL from
 * `createCatalogImageUploadAction`, after media checks its bytes.
 * @param input Untrusted `{ purpose, objectPath }`; only catalog purposes are accepted.
 * @returns The registered file, or why it was rejected.
 * @throws Redirects to sign-in without an admin session.
 */
export async function registerCatalogImageUploadAction(
  input: unknown,
): Promise<ActionResult<FileRef, MediaErrorCode>> {
  if (!catalogImageTargetSchema.safeParse(input).success) {
    return Results.err(UNSUPPORTED_PURPOSE);
  }

  return registerUploadAction(input);
}
