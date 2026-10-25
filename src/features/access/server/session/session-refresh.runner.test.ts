import { AuthApiError, AuthRetryableFetchError } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createProxyClient } from "@/integrations/supabase/proxy-client";

import { refreshAdminSession } from "./session-refresh.runner";
import { ADMIN_SIGN_IN_PATH } from "./session.constants";

vi.mock("@/integrations/supabase/proxy-client", () => ({ createProxyClient: vi.fn() }));

const getSession = vi.fn();
const commit = vi.fn((response: NextResponse) => {
  response.cookies.set("sb-refreshed", "1");
  return response;
});

function request(path: string, method = "GET") {
  return new NextRequest(new URL(path, "http://127.0.0.1:5174"), { method });
}

describe("refreshAdminSession", () => {
  beforeEach(() => {
    getSession.mockReset();
    commit.mockClear();
    vi.mocked(createProxyClient).mockReturnValue({
      client: { auth: { getSession } } as never,
      commit,
    });
  });

  it("continues with refreshed cookies when a session exists", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "token" } }, error: null });

    const response = await refreshAdminSession(request("/admin/orders"));

    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get("sb-refreshed")?.value).toBe("1");
  });

  it("redirects a signed-out navigation to sign-in, carrying cleared cookies", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });

    const response = await refreshAdminSession(request("/admin/orders"));

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "").pathname).toBe(ADMIN_SIGN_IN_PATH);
    expect(commit).toHaveBeenCalledOnce();
  });

  it("redirects when the refresh token was rejected", async () => {
    getSession.mockResolvedValue({
      data: { session: null },
      error: new AuthApiError("Invalid Refresh Token", 400, "refresh_token_not_found"),
    });

    const response = await refreshAdminSession(request("/admin"));

    expect(response.status).toBe(307);
  });

  it("never redirects the sign-in page itself", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });

    const response = await refreshAdminSession(request(ADMIN_SIGN_IN_PATH));

    expect(response.headers.get("location")).toBeNull();
  });

  it("leaves Server Action posts to the action's own authorization", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });

    const response = await refreshAdminSession(request("/admin/orders", "POST"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("does not sign the admin out when Auth is unreachable", async () => {
    getSession.mockResolvedValue({
      data: { session: null },
      error: new AuthRetryableFetchError("fetch failed", 0),
    });

    const response = await refreshAdminSession(request("/admin/orders"));

    expect(response.headers.get("location")).toBeNull();
  });
});
