import { randomUUID } from "node:crypto";
import { expect } from "vitest";

import { ADMIN_SIGN_IN_PATH } from "@/features/access";
import { createServerClient } from "@/integrations/supabase/server-client";
import { createServiceClient } from "@/integrations/supabase/service-client";

/**
 * Demo admins from `supabase/seed.sql`.
 */
export const DemoAdmin = {
  Owner: { email: "owner@snackyzz.test", id: "00000000-0000-7000-8000-000000000001" },
  Staff: { email: "staff@snackyzz.test", id: "00000000-0000-7000-8000-000000000002" },
} as const;

/**
 * The seed's primary brand.
 */
export const SEED_PRIMARY_BRAND_ID = "00000000-0000-7000-8000-0000000000b1";

/**
 * Next's sign-in redirect, which actions must let through rather than report as a failure.
 */
export const SIGN_IN_REDIRECT = { digest: expect.stringContaining(ADMIN_SIGN_IN_PATH) };

/**
 * Helpers shared by the catalog's integration tests against the local stack.
 */
export class CatalogFixtures {
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
   * A slug no other test run uses; catalog rows are archived, never deleted, so runs accumulate.
   * @param label What the slug is for.
   * @returns A unique, valid slug.
   */
  static uniqueSlug(label: string): string {
    return `int-${label}-${randomUUID().slice(0, 8)}`;
  }

  /**
   * Registers file metadata directly, as a finished upload would, without storing bytes.
   * @param purpose The upload purpose.
   * @returns The file id.
   * @throws When the insert fails.
   */
  static async registerFile(purpose: "product_image" | "brand_logo" | "payment_proof") {
    const bucket = purpose === "payment_proof" ? "payment-proofs" : "catalog-images";
    const { data, error } = await createServiceClient()
      .schema("media")
      .from("files")
      .insert({
        bucket,
        object_path: `catalog-int/${randomUUID()}.png`,
        purpose,
        mime_type: "image/png",
        size_bytes: 1,
        width: 1,
        height: 1,
        sha256: "catalog-int-test",
      })
      .select("id")
      .single();
    if (error) {
      throw error;
    }

    return data.id;
  }
}
