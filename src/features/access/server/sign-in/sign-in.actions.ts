"use server";

import "server-only";

import { isAuthRetryableFetchError, type AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createServerClient } from "@/integrations/supabase/server-client";
import { Mask } from "@/shared/lib/logger";
import { Results, SharedError, type SharedErrorCode } from "@/shared/lib/result";
import { runAction, type ActionResult } from "@/shared/lib/run-action";

import { AccessError, type AccessErrorCode } from "../../domain/errors";
import { signInInputSchema } from "../../domain/sign-in";
import { ADMIN_HOME_PATH, loadAdminSession } from "../session";

const TOO_MANY_REQUESTS = 429;

/**
 * Signs an admin in with email and password, then sends them to the admin home.
 * @param input Untrusted credentials from the sign-in form.
 * @returns A failure; on success it redirects instead of returning.
 * @throws Redirects to the admin home once signed in.
 */
export async function signInAction(input: unknown): Promise<ActionResult<never, AccessErrorCode>> {
  const result = await runAction<null, AccessErrorCode | SharedErrorCode>(
    "access.signIn",
    async (log) => {
      const parsed = signInInputSchema.safeParse(input);
      if (!parsed.success) {
        return Results.err(SharedError.InvalidInput);
      }

      const email = Mask.email(parsed.data.email);
      const client = await createServerClient();
      const { error } = await client.auth.signInWithPassword(parsed.data);
      if (error) {
        log.step("authenticate", { email, status: error.status ?? null });
        return Results.err(toAccessError(error));
      }

      log.step("authenticate", { email });
      const session = await loadAdminSession(client);
      if (!session) {
        // Same answer as a wrong password, so the form can't reveal which accounts are admins.
        await client.auth.signOut({ scope: "local" });
        log.step("rejectNonAdmin", { email });
        return Results.err(AccessError.InvalidCredentials);
      }

      log.step("resolveAdmin", { role: session.admin.role });
      return Results.ok(null);
    },
  );

  if (result.ok) {
    redirect(ADMIN_HOME_PATH);
  }

  return result;
}

function toAccessError(error: AuthError): AccessErrorCode {
  if (isAuthRetryableFetchError(error)) {
    // Why: Auth being unreachable is a bug-level failure for runAction, not a credentials problem.
    throw error;
  }

  if (error.status === TOO_MANY_REQUESTS) {
    return AccessError.TooManyAttempts;
  }

  return AccessError.InvalidCredentials;
}
