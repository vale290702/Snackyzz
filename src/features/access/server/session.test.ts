import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DatabaseClient } from "@/integrations/supabase/database-client.types";

import { ADMIN_SIGN_IN_PATH } from "./access.constants";
import type { AdminSession } from "./admin.types";
import { getAdmin, requirePermission } from "./session";
import { loadAdminSession } from "./session-loader";

const navigation = vi.hoisted(() => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  forbidden: vi.fn(() => {
    throw new Error("forbidden");
  }),
}));

vi.mock("next/navigation", () => navigation);
vi.mock("@/integrations/supabase/server-client", () => ({
  createServerClient: vi.fn(async () => ({})),
}));
vi.mock("./session-loader", () => ({ loadAdminSession: vi.fn() }));

const staffSession: AdminSession = {
  admin: {
    id: "00000000-0000-7000-8000-000000000002",
    displayName: "Staff",
    role: "staff",
  },
  permissions: new Set(["orders.view", "orders.decide"]),
  client: {} as DatabaseClient,
};

describe("admin session guards", () => {
  beforeEach(() => {
    vi.mocked(loadAdminSession).mockReset();
  });

  it("getAdmin returns null when nobody is signed in", async () => {
    vi.mocked(loadAdminSession).mockResolvedValue(null);

    expect(await getAdmin()).toBeNull();
  });

  it("getAdmin returns the signed-in admin without permissions or client", async () => {
    vi.mocked(loadAdminSession).mockResolvedValue(staffSession);

    expect(await getAdmin()).toEqual(staffSession.admin);
  });

  it("requirePermission sends visitors without an admin session to sign-in", async () => {
    vi.mocked(loadAdminSession).mockResolvedValue(null);

    await expect(requirePermission("orders.view")).rejects.toThrow(
      `redirect:${ADMIN_SIGN_IN_PATH}`,
    );
  });

  it("requirePermission renders forbidden when the admin lacks the permission", async () => {
    vi.mocked(loadAdminSession).mockResolvedValue(staffSession);

    await expect(requirePermission("catalog.manage")).rejects.toThrow("forbidden");
  });

  it("requirePermission returns the admin and client when the permission is held", async () => {
    vi.mocked(loadAdminSession).mockResolvedValue(staffSession);

    expect(await requirePermission("orders.decide")).toEqual({
      admin: staffSession.admin,
      client: staffSession.client,
    });
  });
});
