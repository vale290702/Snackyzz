import "server-only";

import type { Database, DatabaseClient } from "@/integrations/supabase/database-client.types";

import { storedFileSchema } from "./files.schema";
import type { NewFile, StoredFile } from "./files.types";

const FILE_COLUMNS = "id, purpose, mime_type, size_bytes, width, height, bucket, object_path";

/**
 * Data access for `media.files`, acting as whoever the client is signed in as.
 * @param client A typed Supabase client; RLS decides which rows it can read.
 * @returns Reads and writes that return parsed files.
 */
export function filesRepository(client: DatabaseClient) {
  return {
    /**
     * Finds a file the client may read.
     * @param id The file id.
     * @returns The file, or null when it does not exist or RLS hides it.
     * @throws When the database request fails.
     */
    async find(id: string): Promise<StoredFile | null> {
      const { data, error } = await client
        .schema("media")
        .from("files")
        .select(FILE_COLUMNS)
        .eq("id", id)
        .maybeSingle();
      if (error) {
        throw error;
      }

      return data ? storedFileSchema.parse(data) : null;
    },

    /**
     * Finds the files the client may read among the given ids.
     * @param ids File ids; unknown or hidden ids are left out.
     * @returns The readable files, in no particular order.
     * @throws When the database request fails.
     */
    async findMany(ids: readonly string[]): Promise<StoredFile[]> {
      const { data, error } = await client
        .schema("media")
        .from("files")
        .select(FILE_COLUMNS)
        .in("id", [...ids]);
      if (error) {
        throw error;
      }

      return data.map((row) => storedFileSchema.parse(row));
    },

    /**
     * Records a file once per object; files are immutable, so a retry returns the first record.
     * @param file Metadata for an inspected object.
     * @returns The stored file, new or existing.
     * @throws When the database request fails.
     */
    async insertOnce(file: NewFile): Promise<StoredFile> {
      const { data, error } = await client
        .schema("media")
        .from("files")
        .upsert(toRow(file), { onConflict: "bucket,object_path", ignoreDuplicates: true })
        .select(FILE_COLUMNS)
        .maybeSingle();
      if (error) {
        throw error;
      }

      if (data) {
        return storedFileSchema.parse(data);
      }

      const existing = await findByLocation(client, file.bucket, file.objectPath);
      if (!existing) {
        throw new Error("media.files conflict without an existing row");
      }

      return existing;
    },
  };
}

function toRow(file: NewFile): Database["media"]["Tables"]["files"]["Insert"] {
  return {
    bucket: file.bucket,
    object_path: file.objectPath,
    purpose: file.purpose,
    mime_type: file.mimeType,
    size_bytes: file.sizeBytes,
    width: file.width,
    height: file.height,
    sha256: file.sha256,
    uploaded_by: file.uploadedBy,
  };
}

async function findByLocation(
  client: DatabaseClient,
  bucket: string,
  objectPath: string,
): Promise<StoredFile | null> {
  const { data, error } = await client
    .schema("media")
    .from("files")
    .select(FILE_COLUMNS)
    .eq("bucket", bucket)
    .eq("object_path", objectPath)
    .maybeSingle();
  if (error) {
    throw error;
  }

  return data ? storedFileSchema.parse(data) : null;
}
