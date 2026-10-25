import "server-only";

import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import { publicEnv } from "@/shared/config/env.public";

import type { ProxyClient, SessionCookie } from "./proxy-client.types";
import type { Database } from "../database-client.types";
import { SupabaseFetch } from "../transport";

/**
 * Creates a client for `proxy.ts` that reads the session from the request and records refreshed cookies.
 * @param request The incoming request; refreshed cookies are written back to it for the render.
 * @returns The client and a function that copies the refreshed cookies and cache headers onto a response.
 */
export function createProxyClient(request: NextRequest): ProxyClient {
  let refreshedCookies: SessionCookie[] = [];
  const cacheHeaders: Record<string, string> = {};

  const client = createSupabaseServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          refreshedCookies = cookiesToSet;
          Object.assign(cacheHeaders, headers);
        },
      },
      global: { fetch: SupabaseFetch.withTimeout },
    },
  );

  return {
    client,
    commit(response: NextResponse) {
      for (const { name, value, options } of refreshedCookies) {
        response.cookies.set(name, value, options);
      }

      for (const [key, value] of Object.entries(cacheHeaders)) {
        response.headers.set(key, value);
      }

      return response;
    },
  };
}
