import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";

import { consumeRateLimit } from "./rate-limit.adapter";
import { createServiceClient } from "../service-client";

describe("consumeRateLimit against local Supabase", () => {
  it("admits exactly maxRequests of many concurrent requests for one key", async () => {
    const rule = { key: `test:${randomUUID()}`, maxRequests: 20, windowSeconds: 600 };
    const client = createServiceClient();

    const results = await Promise.all(
      Array.from({ length: 30 }, () => consumeRateLimit(client, rule)),
    );

    const admitted = results.filter((result) => result.ok && result.value.admitted);
    expect(results.every((result) => result.ok)).toBe(true);
    expect(admitted).toHaveLength(rule.maxRequests);
  });
});
