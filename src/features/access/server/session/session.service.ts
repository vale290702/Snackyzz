import "server-only";

import { forbidden, redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { createServerClient } from "@/integrations/supabase/server-client";

import { ADMIN_SIGN_IN_PATH } from "./session.constants";
import type { Admin, Permission } from "../admin";
import { loadAdminSession } from "./session.loader";
import type { AdminSession } from "./session.types";

/**
 * The request's admin session, resolved once per request from the session cookies.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  // Why: session checks compare token expiry with the clock, so they must never be prerendered.
  await connection();
  const client = await createServerClient();

  return loadAdminSession(client);
});

/**
 * Reads the signed-in admin for this request.
 * @returns The admin, or null when nobody with an active admin account is signed in.
 */
export async function getAdmin(): Promise<Admin | null> {
  const session = await getAdminSession();

  return session?.admin ?? null;
}

/**
 * Guards an admin query: the signed-in admin must hold the permission.
 * @param permission The permission the query needs.
 * @returns The admin and their RLS-scoped client.
 * @throws Redirects to sign-in without an admin session; renders 403 without the permission.
 */
export async function requirePermission(
  permission: Permission,
): Promise<Omit<AdminSession, "permissions">> {
  const session = await getAdminSession();
  if (!session) {
    redirect(ADMIN_SIGN_IN_PATH);
  }

  if (!session.permissions.has(permission)) {
    forbidden();
  }

  return {
    admin: session.admin,
    client: session.client,
  };
}
