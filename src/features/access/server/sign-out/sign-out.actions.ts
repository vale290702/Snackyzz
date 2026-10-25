"use server";

import "server-only";

import { redirect } from "next/navigation";

import { createServerClient } from "@/integrations/supabase/server-client";
import { Results } from "@/shared/lib/result";
import { runAction, type ActionResult } from "@/shared/lib/run-action";

import { AccessError } from "../../domain/errors";
import { ADMIN_SIGN_IN_PATH } from "../session";

type SignOutErrorCode = typeof AccessError.SignOutFailed;

/**
 * Ends this device's admin session, then sends the visitor to sign-in.
 * @returns A failure; on success it redirects instead of returning.
 * @throws Redirects to sign-in once signed out.
 */
export async function signOutAction(): Promise<ActionResult<never, SignOutErrorCode>> {
  const result = await runAction<null, SignOutErrorCode>("access.signOut", async (log) => {
    const client = await createServerClient();

    // Local scope ends only this device's session; the admin's other devices stay signed in.
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error) {
      log.step("signOut", { status: error.status ?? null });
      return Results.err(AccessError.SignOutFailed);
    }

    log.step("signOut");
    return Results.ok(null);
  });

  if (result.ok) {
    redirect(ADMIN_SIGN_IN_PATH);
  }

  return result;
}
