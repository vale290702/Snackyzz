import "server-only";

import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { publicEnv } from "@/shared/config/env.public";

import type { Database, DatabaseClient } from "./database-client.types";
import { fetchWithTimeout } from "./fetch-with-timeout.helper";

/**
 * Creates a client that acts as the signed-in user from the request cookies, so RLS applies.
 * @returns A request-scoped client; create one per request, never share it.
 */
export async function createServerClient(): Promise<DatabaseClient> {
  const cookieStore = await cookies();

  return createSupabaseServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components can't write cookies; Server Actions, Route Handlers and the proxy can.
          }
        },
      },
      global: { fetch: fetchWithTimeout },
    },
  );
}
