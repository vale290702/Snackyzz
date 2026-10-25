import "server-only";

import { createClient } from "@supabase/supabase-js";

import { publicEnv } from "@/shared/config/env.public";
import { serverEnv } from "@/shared/config/env.server";

import type { Database, DatabaseClient } from "../database-client.types";
import { SupabaseFetch } from "../transport";

/**
 * Creates a service-role client that bypasses RLS. Callers must authorize before using it.
 * @returns A client acting as `service_role`, with no user session.
 */
export function createServiceClient(): DatabaseClient {
  return createClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SECRET_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { fetch: SupabaseFetch.withTimeout },
  });
}
