import { afterEach, describe, expect, it, vi } from "vitest";

import { SupabaseFetch } from "./fetch-with-timeout.helper";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("SupabaseFetch.withTimeout", () => {
  it("forwards the request and returns the provider response", async () => {
    const response = new Response("ok");
    const fetch = vi.fn().mockResolvedValue(response);
    vi.stubGlobal("fetch", fetch);

    expect(await SupabaseFetch.withTimeout("https://example.test", { method: "POST" })).toBe(
      response,
    );
    expect(fetch).toHaveBeenCalledWith("https://example.test", {
      method: "POST",
      signal: expect.any(AbortSignal),
    });
  });

  it.each(["caller", "timeout"])("preserves %s cancellation", async (source) => {
    const caller = new AbortController();
    const timeout = new AbortController();
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(timeout.signal);
    const fetch = vi.fn().mockResolvedValue(new Response());
    vi.stubGlobal("fetch", fetch);

    await SupabaseFetch.withTimeout("https://example.test", { signal: caller.signal });
    const options = fetch.mock.calls[0]?.[1] as RequestInit;
    expect(options.signal?.aborted).toBe(false);

    const controller = source === "caller" ? caller : timeout;
    controller.abort();
    expect(options.signal?.aborted).toBe(true);
    expect(AbortSignal.timeout).toHaveBeenCalledWith(10_000);
  });

  it("preserves provider failures for the caller to handle", async () => {
    const failure = new TypeError("network unavailable");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(failure));

    await expect(SupabaseFetch.withTimeout("https://example.test")).rejects.toBe(failure);
  });
});
