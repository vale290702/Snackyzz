import "server-only";

import type { DatabaseClient } from "@/integrations/supabase/database-client.types";

import { adminSchema, permissionsSchema } from "./admin.schema";
import type { Admin, Permission } from "./admin.types";

/**
 * Data access for the access schema, acting as whoever the client is signed in as.
 * @param client A typed Supabase client; RLS decides which rows it can read.
 * @returns Reads that return parsed admins and permissions.
 */
export function accessRepository(client: DatabaseClient) {
  return {
    /**
     * Finds an admin who has not been archived.
     * @param userId The Supabase Auth user id.
     * @returns The admin, or null when there is none the client may read.
     * @throws When the database request fails.
     */
    async findActiveAdmin(userId: string): Promise<Admin | null> {
      const { data, error } = await client
        .schema("access")
        .from("admins")
        .select("user_id, display_name, role")
        .eq("user_id", userId)
        .is("archived_at", null)
        .maybeSingle();
      if (error) {
        throw error;
      }

      return data ? adminSchema.parse(data) : null;
    },

    /**
     * Reads the signed-in user's permissions from the SQL permission map.
     * @returns The permissions; empty for archived admins and non-admins.
     * @throws When the database request fails.
     */
    async listMyPermissions(): Promise<ReadonlySet<Permission>> {
      const { data, error } = await client.schema("access").rpc("my_permissions");
      if (error) {
        throw error;
      }

      return new Set(permissionsSchema.parse(data));
    },
  };
}
