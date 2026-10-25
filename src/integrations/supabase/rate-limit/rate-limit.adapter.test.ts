import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

import { consumeRateLimit } from "./rate-limit.adapter";
import { RateLimitError } from "./rate-limit.constants";
import type { Database } from "../database-client.types";

const rule = { key: "scope:opaque-hmac", maxRequests: 20, windowSeconds: 600 };

function clientWithFetch(fetch: typeof globalThis.fetch) {
  return createClient<Database>("https://example.supabase.co", "test-key", {
    global: { fetch },
    auth: { persistSession: false },
  });
}

function respondWith(status: number, body: unknown) {
  return vi.fn<typeof globalThis.fetch>(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
  );
}

describe("consumeRateLimit", () => {
  it.each([true, false])("passes the rule through and reports admitted=%s", async (admitted) => {
    const fetch = respondWith(200, admitted);

    const result = await consumeRateLimit(clientWithFetch(fetch), rule);

    expect(result).toEqual({ ok: true, value: { admitted } });
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      rate_key: rule.key,
      max_requests: rule.maxRequests,
      window_seconds: rule.windowSeconds,
    });
  });

  it.each([
    [403, RateLimitError.Permanent],
    [503, RateLimitError.Retryable],
  ])("maps HTTP %s to %s without the provider message", async (status, error) => {
    const fetch = respondWith(status, { message: "private provider detail" });

    expect(await consumeRateLimit(clientWithFetch(fetch), rule)).toEqual({ ok: false, error });
  });

  it("maps a network timeout to retryable", async () => {
    const fetch = async () => {
      throw new DOMException("timeout", "TimeoutError");
    };

    expect(await consumeRateLimit(clientWithFetch(fetch), rule)).toEqual({
      ok: false,
      error: RateLimitError.Retryable,
    });
  });
});
