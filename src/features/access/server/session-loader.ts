import "server-only";

import { isAuthRetryableFetchError } from "@supabase/supabase-js";

import type { DatabaseClient } from "@/integrations/supabase/database-client.types";

import type { AdminSession } from "./admin.types";
import { accessRepository } from "./repository";

/**
 * Resolves the admin a client is signed in as, verifying the session with Supabase Auth.
 * @param client A client carrying the user's session.
 * @returns The admin session, or null when signed out, the session is invalid or the user isn't an active admin.
 * @throws When Supabase Auth or the database can't be reached.
 */
export async function loadAdminSession(client: DatabaseClient): Promise<AdminSession | null> {
  const { data, error } = await client.auth.getUser();
  if (isAuthRetryableFetchError(error)) {
    throw error;
  }
  if (error || !data.user) {
    return null;
  }

  const repository = accessRepository(client);
  const [admin, permissions] = await Promise.all([
    repository.findActiveAdmin(data.user.id),
    repository.listMyPermissions(),
  ]);
  if (!admin) {
    return null;
  }

  return {
    admin,
    permissions,
    client,
  };
}
