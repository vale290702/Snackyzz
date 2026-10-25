import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { DatabaseClient } from "@/integrations/supabase/database-client.types";
import { CapabilityKind, CapabilitySource, defineCapability } from "@/shared/lib/capability";
import { Results } from "@/shared/lib/result";

import { ADMIN_SIGN_IN_PATH, getAdminSession, type AdminSession } from "../session";
import { buildAdminContext, getAdminContext } from "./context.factory";
import type { AdminContext } from "./context.types";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));
vi.mock("../session", async () => ({
  ...(await import("../session/session.constants")),
  getAdminSession: vi.fn(),
}));

const staffSession: AdminSession = {
  admin: {
    id: "00000000-0000-7000-8000-000000000002",
    displayName: "Staff",
    role: "staff",
  },
  permissions: new Set(["orders.view", "orders.decide"]),
  client: {} as DatabaseClient,
};

const manageCatalog = defineCapability({
  name: "catalog.sample",
  kind: CapabilityKind.Mutation,
  permission: "catalog.manage",
  input: z.object({}),
  execute: (context: AdminContext) => Results.ok(context.admin.id),
});

describe("buildAdminContext", () => {
  it("carries the session's admin, client and SQL permissions with the source", () => {
    const context = buildAdminContext(staffSession, CapabilitySource.AdminWeb);

    expect(context).toEqual({
      admin: staffSession.admin,
      client: staffSession.client,
      permissions: staffSession.permissions,
      source: CapabilitySource.AdminWeb,
    });
  });

  it("lets capabilities refuse staff on catalog management", async () => {
    const context = buildAdminContext(staffSession, CapabilitySource.AdminWeb);

    expect(await manageCatalog.run(context, {})).toEqual(Results.err("forbidden"));
  });
});

describe("getAdminContext", () => {
  it("sends visitors without an admin session to sign-in", async () => {
    vi.mocked(getAdminSession).mockResolvedValue(null);

    await expect(getAdminContext({ source: CapabilitySource.AdminWeb })).rejects.toThrow(
      `redirect:${ADMIN_SIGN_IN_PATH}`,
    );
  });

  it("builds the context for the signed-in admin", async () => {
    vi.mocked(getAdminSession).mockResolvedValue(staffSession);

    const context = await getAdminContext({ source: CapabilitySource.AdminWeb });

    expect(context.admin).toBe(staffSession.admin);
    expect(context.permissions).toBe(staffSession.permissions);
  });
});
