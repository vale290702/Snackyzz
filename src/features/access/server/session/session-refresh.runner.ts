import "server-only";

import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createProxyClient } from "@/integrations/supabase/proxy-client";

import { ADMIN_SIGN_IN_PATH } from "./session.constants";

/**
 * Refreshes the admin's Supabase session cookies before an `/admin` request renders.
 * Visitors without a session are redirected to sign-in as a convenience; it is not authorization.
 * @param request The incoming `/admin` request.
 * @returns The response to continue with, carrying any rotated session cookies.
 */
export async function refreshAdminSession(request: NextRequest): Promise<NextResponse> {
  const { client, commit } = createProxyClient(request);

  // Why: getSession reads the cookie and refreshes an expired token without an Auth round trip
  // otherwise, which suits a proxy that also runs for prefetches. The DAL verifies with getUser.
  const { data, error } = await client.auth.getSession();

  const isSignedOut = !data.session && !isAuthRetryableFetchError(error);
  const isNavigation = request.method === "GET";
  const isSignInPage = request.nextUrl.pathname === ADMIN_SIGN_IN_PATH;
  if (isSignedOut && isNavigation && !isSignInPage) {
    return commit(NextResponse.redirect(new URL(ADMIN_SIGN_IN_PATH, request.url)));
  }

  return commit(NextResponse.next({ request }));
}
