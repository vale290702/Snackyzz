import { describe, expect, it } from "vitest";
import { z } from "zod";

import { signInInputSchema } from "./sign-in.schema";

describe("signInInputSchema", () => {
  it("accepts credentials and trims the email", () => {
    const parsed = signInInputSchema.parse({
      email: "  staff@snackyzz.test ",
      password: "snackyzz-demo",
    });

    expect(parsed).toEqual({ email: "staff@snackyzz.test", password: "snackyzz-demo" });
  });

  it("keeps the password exactly as typed", () => {
    const parsed = signInInputSchema.parse({ email: "staff@snackyzz.test", password: " secret " });

    expect(parsed.password).toBe(" secret ");
  });

  it("reports field codes, not copy, for an invalid email and an empty password", () => {
    const result = signInInputSchema.safeParse({ email: "staff@", password: "" });

    expect(result.success).toBe(false);
    expect(result.error && z.flattenError(result.error).fieldErrors).toEqual({
      email: ["email_invalid"],
      password: ["password_required"],
    });
  });

  it("rejects missing fields", () => {
    expect(signInInputSchema.safeParse({}).success).toBe(false);
  });
});
