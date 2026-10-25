import "server-only";

import type { DatabaseClient } from "@/integrations/supabase/database-client.types";
import { Results, type Result } from "@/shared/lib/result";

import type { SignedUpload } from "./storage.types";
import { MediaError } from "../../domain/errors";
import type { MediaBucketName } from "../../domain/upload-policy";

type StorageResult<Value> = Result<Value, typeof MediaError.StorageUnavailable>;

/**
 * Object storage for media buckets. Provider failures become `storage_unavailable`; paths,
 * URLs and provider messages never leave this module in an error.
 * @param client A Supabase client allowed to act on the bucket.
 * @returns Storage operations for media objects.
 */
export function mediaStorage(client: DatabaseClient) {
  return {
    /**
     * Issues a one-time upload token that cannot overwrite an existing object.
     * @param bucket The target bucket.
     * @param objectPath The server-generated object key.
     * @returns The signed upload URL and token.
     */
    async signUpload(
      bucket: MediaBucketName,
      objectPath: string,
    ): Promise<StorageResult<SignedUpload>> {
      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUploadUrl(objectPath, { upsert: false });
      if (error) {
        return Results.err(MediaError.StorageUnavailable);
      }

      return Results.ok({ signedUrl: data.signedUrl, token: data.token });
    },

    /**
     * Downloads an object to inspect it.
     * @param bucket The object's bucket.
     * @param objectPath The object's key.
     * @returns The object, or a failure when it is missing or storage is down.
     */
    async download(bucket: MediaBucketName, objectPath: string): Promise<StorageResult<Blob>> {
      const { data, error } = await client.storage.from(bucket).download(objectPath);
      if (error) {
        return Results.err(MediaError.StorageUnavailable);
      }

      return Results.ok(data);
    },

    /**
     * Deletes an object.
     * @param bucket The object's bucket.
     * @param objectPath The object's key.
     * @throws When storage refuses; callers must not report a failed deletion as cleaned up.
     */
    async remove(bucket: MediaBucketName, objectPath: string): Promise<void> {
      const { error } = await client.storage.from(bucket).remove([objectPath]);
      if (error) {
        throw error;
      }
    },

    /**
     * Issues a short-lived read URL for a private object.
     * @param bucket The object's bucket.
     * @param objectPath The object's key.
     * @param expiresInSeconds How long the URL stays valid.
     * @returns The signed URL.
     */
    async signRead(
      bucket: string,
      objectPath: string,
      expiresInSeconds: number,
    ): Promise<StorageResult<string>> {
      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrl(objectPath, expiresInSeconds);
      if (error) {
        return Results.err(MediaError.StorageUnavailable);
      }

      return Results.ok(data.signedUrl);
    },

    /**
     * Builds the public URL of an object in a public bucket. Makes no request.
     * @param bucket A public bucket.
     * @param objectPath The object's key.
     * @returns The public URL.
     */
    publicUrl(bucket: string, objectPath: string): string {
      return client.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
    },
  };
}
