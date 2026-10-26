import { describe, expect, it, vi } from "vitest";

import { EventJob } from "./job.helper";

vi.mock("@/shared/config/env.server", () => ({
  serverEnv: { JOB_SECRET: "test-job-secret-with-at-least-32-characters" },
}));

describe("event job authorization", () => {
  it("accepts only the configured bearer secret", () => {
    const headers = { authorization: "Bearer test-job-secret-with-at-least-32-characters" };
    expect(EventJob.isAuthorized(new Request("http://localhost", { headers }))).toBe(true);
  });

  it.each([undefined, "", "Bearer wrong", "Basic test", "Bearer é"])(
    "refuses missing or invalid credentials %s",
    (authorization) => {
      const headers = authorization ? { authorization } : {};
      expect(EventJob.isAuthorized(new Request("http://localhost", { headers }))).toBe(false);
    },
  );
});
