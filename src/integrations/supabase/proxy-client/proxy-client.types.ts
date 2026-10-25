import type { CookieOptions } from "@supabase/ssr";
import type { NextResponse } from "next/server";

import type { DatabaseClient } from "../database-client.types";

/**
 * A Supabase Auth cookie the client asked to write.
 */
export type SessionCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

/**
 * A request-scoped client for `proxy.ts`, plus the step that hands refreshed cookies to the browser.
 */
export type ProxyClient = {
  readonly client: DatabaseClient;
  readonly commit: (response: NextResponse) => NextResponse;
};
