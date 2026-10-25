import "server-only";

import { redirect } from "next/navigation";

import type { AdminContext, AdminContextSource, AdminContextOptions } from "./context.types";
import { ADMIN_SIGN_IN_PATH, getAdminSession, type AdminSession } from "../session";

/**
 * Turns a verified admin session into the context capabilities run with.
 * @param session A session resolved by trusted server code, never built from client input.
 * @param source The front end the capability is called from.
 * @returns The capability context.
 */
export function buildAdminContext(session: AdminSession, source: AdminContextSource): AdminContext {
  return {
    client: session.client,
    admin: session.admin,
    permissions: session.permissions,
    source,
  };
}

/**
 * Builds the capability context for the admin signed in on this request.
 * @param options The front end the capability is called from.
 * @returns The capability context; each capability then checks its own permission.
 * @throws Redirects to sign-in without an admin session.
 */
export async function getAdminContext(options: AdminContextOptions): Promise<AdminContext> {
  const session = await getAdminSession();
  if (!session) {
    redirect(ADMIN_SIGN_IN_PATH);
  }

  return buildAdminContext(session, options.source);
}
