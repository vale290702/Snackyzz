import { afterEach, describe, expect, it, vi } from "vitest";

import { kickEventConsumers } from "./kick.helper";

vi.mock("@/shared/config/env.server", () => ({
  serverEnv: { JOB_SECRET: "test-job-secret-with-at-least-32-characters" },
}));
vi.mock("@/shared/config/env.public", () => ({
  publicEnv: { NEXT_PUBLIC_SITE_URL: "https://snackyzz.test" },
}));
vi.mock("@/shared/lib/logger", () => ({
  createLogger: () => ({ step: vi.fn(), error: vi.fn() }),
}));

afterEach(() => vi.unstubAllGlobals());

describe("kick event consumers", () => {
  it("posts to the composition root with authentication and a bounded timeout", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetch);

    expect(await kickEventConsumers()).toEqual({ ok: true, value: undefined });
    expect(fetch).toHaveBeenCalledWith(new URL("https://snackyzz.test/api/jobs/events"), {
      method: "POST",
      headers: { authorization: "Bearer test-job-secret-with-at-least-32-characters" },
      signal: expect.any(AbortSignal),
      redirect: "error",
    });
  });

  it.each(["reject", "http"])("returns a safe failure for %s", async (mode) => {
    const fetch =
      mode === "reject"
        ? vi.fn().mockRejectedValue(new Error("secret provider payload"))
        : vi.fn().mockResolvedValue(new Response("secret body", { status: 503 }));
    vi.stubGlobal("fetch", fetch);

    expect(await kickEventConsumers()).toEqual({ ok: false, error: "kick_failed" });
  });
});
