import "server-only";

import { createClient } from "@supabase/supabase-js";

import { publicEnv } from "@/shared/config/env.public";

import type { Database, DatabaseClient } from "../database-client.types";
import { SupabaseFetch } from "../transport";

/**
 * Creates a cookie-free client that acts as `anon`, safe inside `'use cache'` public reads.
 * @returns A client with no session; RLS applies as an anonymous visitor.
 */
export function createAnonClient(): DatabaseClient {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: { fetch: SupabaseFetch.withTimeout },
    },
  );
}
