import { describe, expect, it, vi } from "vitest";

import * as events from "@/features/events";

const { runEventConsumers } = events;

import { POST } from "./route";

vi.mock("@/integrations/supabase/service-client", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/shared/config/env.public", () => ({ publicEnv: {} }));
vi.mock("@/shared/config/env.server", () => ({
  serverEnv: { JOB_SECRET: "test-job-secret-with-at-least-32-characters" },
}));
vi.mock("@/features/events", async (importOriginal) => ({
  ...(await importOriginal<typeof events>()),
  runEventConsumers: vi.fn(),
}));

function request(authorized: boolean) {
  return new Request("http://localhost/api/jobs/events", {
    method: "POST",
    headers: {
      authorization: authorized ? "Bearer test-job-secret-with-at-least-32-characters" : "wrong",
    },
  });
}

describe("POST /api/jobs/events", () => {
  it("rejects unauthorized requests before running consumers", async () => {
    vi.mocked(runEventConsumers).mockClear();
    expect((await POST(request(false))).status).toBe(401);
    expect(runEventConsumers).not.toHaveBeenCalled();
  });

  it("passes an explicit consumer list from the composition root", async () => {
    vi.mocked(runEventConsumers).mockResolvedValue({
      ok: true,
      value: { processed: 0, failed: 0 },
    });
    expect((await POST(request(true))).status).toBe(200);
    expect(runEventConsumers).toHaveBeenCalledWith([]);
  });

  it("returns retryable status when a delivery pass reports failures", async () => {
    vi.mocked(runEventConsumers).mockResolvedValue({
      ok: true,
      value: { processed: 1, failed: 1 },
    });
    expect((await POST(request(true))).status).toBe(503);
  });
});
