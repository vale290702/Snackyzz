import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Database, DatabaseClient } from "@/integrations/supabase/database-client.types";
import { createServiceClient } from "@/integrations/supabase/service-client";
import { publicEnv } from "@/shared/config/env.public";

import type { AdminRole } from "../admin";
import { loadAdminSession } from "./session.loader";

const runId = randomUUID();
const password = `access-int-${runId}`;
const service = createServiceClient();
const fixtureUserIds: string[] = [];

function userClient(): DatabaseClient {
  return createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function createUser(label: string): Promise<{ id: string; email: string }> {
  const email = `${label}-${runId}@access.test`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    throw error;
  }

  fixtureUserIds.push(data.user.id);
  return { id: data.user.id, email };
}

async function createAdmin(label: string, role: AdminRole, isArchived = false) {
  const user = await createUser(label);
  const { error } = await service
    .schema("access")
    .from("admins")
    .insert({
      user_id: user.id,
      display_name: label,
      role,
      archived_at: isArchived ? new Date().toISOString() : null,
    });
  if (error) {
    throw error;
  }

  return user;
}

async function signedInAs(email: string): Promise<DatabaseClient> {
  const client = userClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }

  return client;
}

describe("loadAdminSession", () => {
  let staff: { id: string; email: string };
  let archived: { id: string; email: string };
  let customer: { id: string; email: string };

  beforeAll(async () => {
    staff = await createAdmin("staff", "staff");
    archived = await createAdmin("archived", "staff", true);
    customer = await createUser("customer");
  });

  afterAll(async () => {
    // Admins are archived, never deleted, so the fixtures stay behind with unique emails.
    await service
      .schema("access")
      .from("admins")
      .update({ archived_at: new Date().toISOString() })
      .in("user_id", fixtureUserIds)
      .is("archived_at", null);
  });

  it("resolves staff with the SQL permission map, which excludes catalog management", async () => {
    const session = await loadAdminSession(await signedInAs(staff.email));

    expect(session?.admin).toEqual({
      id: staff.id,
      displayName: "staff",
      role: "staff",
    });
    expect(session?.permissions.has("orders.decide")).toBe(true);
    expect(session?.permissions.has("catalog.manage")).toBe(false);
  });

  it("returns null for an archived admin with a valid session", async () => {
    expect(await loadAdminSession(await signedInAs(archived.email))).toBeNull();
  });

  it("returns null for a signed-in user who is not an admin", async () => {
    expect(await loadAdminSession(await signedInAs(customer.email))).toBeNull();
  });

  it("returns null without a session", async () => {
    expect(await loadAdminSession(userClient())).toBeNull();
  });
});
