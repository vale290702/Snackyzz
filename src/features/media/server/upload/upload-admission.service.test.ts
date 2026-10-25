import { beforeEach, describe, expect, it, vi } from "vitest";

import { admitUpload } from "./upload-admission.service";

const request = vi.hoisted(() => ({
  headers: new Headers(),
  isProduction: true,
  limiter: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => request.headers }));
vi.mock("@/shared/config/runtime", () => ({ isProduction: () => request.isProduction }));
vi.mock("@/shared/config/env.server", () => ({
  serverEnv: { MEDIA_SIGNING_SECRET: "test-secret-with-at-least-32-characters" },
}));
vi.mock("@/integrations/supabase/service-client", () => ({ createServiceClient: () => ({}) }));
vi.mock("@/integrations/supabase/rate-limit", () => ({ consumeRateLimit: request.limiter }));

describe("admitUpload", () => {
  beforeEach(() => {
    request.headers = new Headers({ "x-vercel-forwarded-for": "192.0.2.4" });
    request.isProduction = true;
    request.limiter.mockReset();
  });

  it("keys the limiter by an HMAC of the IP, never the IP itself", async () => {
    request.limiter.mockResolvedValue({ ok: true, value: { admitted: true } });

    expect(await admitUpload()).toBe(true);
    const [, rule] = request.limiter.mock.calls[0] ?? [];
    expect(rule.key).toMatch(/^media-upload:/);
    expect(rule.key).not.toContain("192.0.2.4");
  });

  it("refuses a production request without a trusted IP", async () => {
    request.headers = new Headers();

    expect(await admitUpload()).toBe(false);
    expect(request.limiter).not.toHaveBeenCalled();
  });

  it("refuses when the limiter denies or cannot answer", async () => {
    request.limiter.mockResolvedValueOnce({ ok: true, value: { admitted: false } });
    request.limiter.mockResolvedValueOnce({ ok: false, error: "retryable" });

    expect(await admitUpload()).toBe(false);
    expect(await admitUpload()).toBe(false);
  });
});
