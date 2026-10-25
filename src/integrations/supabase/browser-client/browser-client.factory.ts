import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

import { publicEnv } from "@/shared/config/env.public";

import type { Database, DatabaseClient } from "../database-client.types";
import { SupabaseFetch } from "../transport";

/**
 * Creates the browser client, used only for auth and signed uploads; data goes through the server.
 * @returns A singleton client that keeps the session in cookies shared with the server.
 */
export function createBrowserClient(): DatabaseClient {
  return createSupabaseBrowserClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      global: { fetch: SupabaseFetch.withTimeout },
    },
  );
}
