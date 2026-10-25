import { describe, expect, it } from "vitest";

import { LOOPBACK_IP, TRUSTED_CLIENT_IP_HEADER } from "./client-ip.constants";
import { ClientIp } from "./client-ip.helper";

const production = { allowLoopbackFallback: false };
const development = { allowLoopbackFallback: true };

function headersWith(name: string, value: string): Headers {
  return new Headers({ [name]: value });
}

describe("ClientIp", () => {
  it("reads the trusted header", () => {
    const headers = headersWith(TRUSTED_CLIENT_IP_HEADER, "192.0.2.4");

    expect(ClientIp.fromHeaders(headers, production)).toBe("192.0.2.4");
  });

  it("ignores client-controlled forwarding headers in production", () => {
    const headers = headersWith("x-forwarded-for", "192.0.2.4");

    expect(ClientIp.fromHeaders(headers, production)).toBeNull();
  });

  it("rejects a list of addresses", () => {
    const headers = headersWith(TRUSTED_CLIENT_IP_HEADER, "192.0.2.4, 127.0.0.1");

    expect(ClientIp.fromHeaders(headers, production)).toBeNull();
  });

  it("canonicalizes equivalent IPv6 spellings", () => {
    expect(ClientIp.canonical("2001:0db8:0000:0000:0000:0000:0000:0001")).toBe("2001:db8::1");
  });

  it("falls back to loopback only when allowed", () => {
    expect(ClientIp.fromHeaders(new Headers(), development)).toBe(LOOPBACK_IP);
    expect(ClientIp.fromHeaders(new Headers(), production)).toBeNull();
  });
});
