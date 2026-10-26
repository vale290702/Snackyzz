import { randomUUID } from "node:crypto";
import { expect } from "vitest";

import { ADMIN_SIGN_IN_PATH } from "@/features/access";
import { createServerClient } from "@/integrations/supabase/server-client";

/**
 * Demo admins from `supabase/seed.sql`.
 */
export const DemoAdmin = {
  Owner: { email: "owner@snackyzz.test", id: "00000000-0000-7000-8000-000000000001" },
  Staff: { email: "staff@snackyzz.test", id: "00000000-0000-7000-8000-000000000002" },
} as const;

/**
 * Next's sign-in redirect, which actions must let through rather than report as a failure.
 */
export const SIGN_IN_REDIRECT = { digest: expect.stringContaining(ADMIN_SIGN_IN_PATH) };

/**
 * Helpers shared by fulfillment's integration tests against the local stack.
 */
export class FulfillmentFixtures {
  private constructor() {}

  /**
   * Signs the in-memory request in as a demo admin.
   * @param email The demo admin's email.
   * @throws When Supabase Auth refuses.
   */
  static async signInAs(email: string): Promise<void> {
    const client = await createServerClient();
    const { error } = await client.auth.signInWithPassword({ email, password: "snackyzz-demo" });
    if (error) {
      throw error;
    }
  }

  /**
   * A name no other test run uses; locations and zones are archived, never deleted, so runs
   * accumulate.
   * @param label What the name is for.
   * @returns A unique name.
   */
  static uniqueName(label: string): string {
    return `int-${label}-${randomUUID().slice(0, 8)}`;
  }
}
