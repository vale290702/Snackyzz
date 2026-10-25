import type * as Navigation from "next/navigation";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createServiceClient } from "@/integrations/supabase/service-client";

import { signInAction } from "./sign-in.actions";
import { ADMIN_HOME_PATH, ADMIN_SIGN_IN_PATH } from "../session";
import { signOutAction } from "../sign-out/sign-out.actions";

type StoredCookie = { name: string; value: string };

// An in-memory stand-in for the request's cookie jar, which Server Actions both read and write.
const jar = vi.hoisted(() => new Map<string, string>());

vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: (): StoredCookie[] => [...jar].map(([name, value]) => ({ name, value })),
    set: (name: string, value: string, options?: { maxAge?: number }) => {
      if (value === "" || options?.maxAge === 0) {
        jar.delete(name);
        return;
      }

      jar.set(name, value);
    },
  }),
}));

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof Navigation>()),
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

const runId = randomUUID();
const password = `sign-in-int-${runId}`;
const service = createServiceClient();
const fixtureUserIds: string[] = [];

async function createUser(label: string): Promise<string> {
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
  return email;
}

async function createArchivedAdmin(): Promise<string> {
  const email = await createUser("archived");
  const { error } = await service
    .schema("access")
    .from("admins")
    .insert({
      user_id: fixtureUserIds.at(-1) ?? "",
      display_name: "archived",
      role: "staff",
      archived_at: new Date().toISOString(),
    });
  if (error) {
    throw error;
  }

  return email;
}

function hasSessionCookie(): boolean {
  return [...jar.keys()].some((name) => name.includes("-auth-token"));
}

describe("signInAction", () => {
  let customerEmail: string;
  let archivedEmail: string;

  beforeAll(async () => {
    customerEmail = await createUser("customer");
    archivedEmail = await createArchivedAdmin();
  });

  beforeEach(() => {
    jar.clear();
  });

  afterAll(async () => {
    // Admin rows restrict auth.users deletes, so the archived fixture stays behind with a unique email.
    for (const userId of fixtureUserIds) {
      await service.auth.admin.deleteUser(userId);
    }
  });

  it("signs a seeded admin in, stores the session cookie and redirects to the admin home", async () => {
    await expect(
      signInAction({ email: "staff@snackyzz.test", password: "snackyzz-demo" }),
    ).rejects.toThrow(`redirect:${ADMIN_HOME_PATH}`);

    expect(hasSessionCookie()).toBe(true);
  });

  it("returns invalid_credentials for a wrong password", async () => {
    const result = await signInAction({ email: "staff@snackyzz.test", password: "wrong" });

    expect(result).toEqual({ ok: false, error: "invalid_credentials" });
    expect(hasSessionCookie()).toBe(false);
  });

  it("gives a signed-in non-admin the same answer and leaves no session behind", async () => {
    const result = await signInAction({ email: customerEmail, password });

    expect(result).toEqual({ ok: false, error: "invalid_credentials" });
    expect(hasSessionCookie()).toBe(false);
  });

  it("refuses an archived admin the same way", async () => {
    const result = await signInAction({ email: archivedEmail, password });

    expect(result).toEqual({ ok: false, error: "invalid_credentials" });
    expect(hasSessionCookie()).toBe(false);
  });

  it("rejects malformed input before calling Auth", async () => {
    const result = await signInAction({ email: "not-an-email", password: "" });

    expect(result).toEqual({ ok: false, error: "invalid_input" });
  });
});

describe("signOutAction", () => {
  beforeEach(() => {
    jar.clear();
  });

  it("clears the session cookie and redirects to sign-in", async () => {
    await expect(
      signInAction({ email: "owner@snackyzz.test", password: "snackyzz-demo" }),
    ).rejects.toThrow(`redirect:${ADMIN_HOME_PATH}`);
    expect(hasSessionCookie()).toBe(true);

    await expect(signOutAction()).rejects.toThrow(`redirect:${ADMIN_SIGN_IN_PATH}`);

    expect(hasSessionCookie()).toBe(false);
  });
});
