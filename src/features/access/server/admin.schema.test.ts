import { describe, expect, it } from "vitest";

import { adminSchema, permissionsSchema } from "./admin.schema";

describe("adminSchema", () => {
  it("maps an admins row to the app's admin shape", () => {
    const row = {
      user_id: "00000000-0000-7000-8000-000000000001",
      display_name: "Ana",
      role: "owner",
    };

    expect(adminSchema.parse(row)).toEqual({
      id: "00000000-0000-7000-8000-000000000001",
      displayName: "Ana",
      role: "owner",
    });
  });

  it("rejects a role the database doesn't define", () => {
    const row = {
      user_id: "00000000-0000-7000-8000-000000000001",
      display_name: "Ana",
      role: "superuser",
    };

    expect(adminSchema.safeParse(row).success).toBe(false);
  });
});

describe("permissionsSchema", () => {
  it("accepts permissions from the SQL map", () => {
    expect(permissionsSchema.parse(["orders.view", "catalog.manage"])).toEqual([
      "orders.view",
      "catalog.manage",
    ]);
  });

  it("rejects permissions missing from the generated types", () => {
    expect(permissionsSchema.safeParse(["orders.view", "orders.delete"]).success).toBe(false);
  });
});
