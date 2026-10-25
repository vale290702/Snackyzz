import "server-only";

import { z } from "zod";

import { requirePermission } from "@/features/access";
import { createAnonClient } from "@/integrations/supabase/anon-client";
import { Results, SharedError, type SharedErrorCode } from "@/shared/lib/result";
import { runAction, type ActionResult } from "@/shared/lib/run-action";

import { PROOF_READ_PERMISSION, PROOF_READ_SECONDS } from "./read.constants";
import type { CatalogImage } from "./read.types";
import { MediaError, type MediaErrorCode } from "../../domain/errors";
import { CATALOG_PURPOSES, PROOF_PURPOSES } from "../../domain/upload-policy";
import { filesRepository } from "../files";
import { mediaStorage } from "../storage";

const fileIdSchema = z.uuid();

/**
 * Issues a short-lived URL to view a payment or refund proof.
 * @param fileId Untrusted file id.
 * @returns A signed URL, or why it could not be issued.
 * @throws Redirects to sign-in without an admin session; renders 403 without `orders.view`.
 */
export async function getSignedReadUrl(
  fileId: unknown,
): Promise<ActionResult<string, MediaErrorCode>> {
  return runAction<string, MediaErrorCode | SharedErrorCode>("media.signedRead", async (log) => {
    const { client } = await requirePermission(PROOF_READ_PERMISSION);
    log.step("authorize");

    const parsed = fileIdSchema.safeParse(fileId);
    if (!parsed.success) {
      return Results.err(SharedError.InvalidInput);
    }

    const file = await filesRepository(client).find(parsed.data);
    if (!file || !PROOF_PURPOSES.has(file.ref.purpose)) {
      return Results.err(MediaError.FileNotFound);
    }

    const { bucket, objectPath } = file.location;
    const url = await mediaStorage(client).signRead(bucket, objectPath, PROOF_READ_SECONDS);
    if (url.ok) {
      log.step("signRead");
    }

    return url;
  });
}

/**
 * Resolves the public URL of a product image or brand logo.
 * @param fileId Untrusted file id.
 * @returns The public URL, or `file_not_found` for anything that is not a catalog image.
 */
export async function publicImageUrl(
  fileId: unknown,
): Promise<ActionResult<string, MediaErrorCode>> {
  return runAction<string, MediaErrorCode | SharedErrorCode>("media.publicImage", async (log) => {
    const parsed = fileIdSchema.safeParse(fileId);
    if (!parsed.success) {
      return Results.err(SharedError.InvalidInput);
    }

    // The anonymous client applies the same RLS a shopper gets.
    const client = createAnonClient();
    const file = await filesRepository(client).find(parsed.data);
    if (!file || !CATALOG_PURPOSES.has(file.ref.purpose)) {
      return Results.err(MediaError.FileNotFound);
    }
    log.step("resolveImage");

    const { bucket, objectPath } = file.location;
    return Results.ok(mediaStorage(client).publicUrl(bucket, objectPath));
  });
}

/**
 * Resolves product images and brand logos for the catalog, as a shopper may see them.
 * @param fileIds File ids held by catalog rows.
 * @returns Each catalog image found, keyed by file id; proofs and unknown ids are left out.
 * @throws When the database request fails.
 */
export async function findCatalogImages(
  fileIds: readonly string[],
): Promise<ReadonlyMap<string, CatalogImage>> {
  const images = new Map<string, CatalogImage>();
  if (fileIds.length === 0) {
    return images;
  }

  // The anonymous client applies the same RLS a shopper gets, so this is safe in cached reads.
  const client = createAnonClient();
  const files = await filesRepository(client).findMany(fileIds);

  for (const file of files) {
    if (!CATALOG_PURPOSES.has(file.ref.purpose)) {
      continue;
    }

    const { bucket, objectPath } = file.location;
    images.set(file.ref.id, {
      ref: file.ref,
      url: mediaStorage(client).publicUrl(bucket, objectPath),
    });
  }

  return images;
}
