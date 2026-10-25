import "server-only";

import { isIP, SocketAddress } from "node:net";

import { LOOPBACK_IP, TRUSTED_CLIENT_IP_HEADER } from "./client-ip.constants";
import type { ClientIpOptions } from "./client-ip.types";

const IPV6 = 6;

/**
 * Resolves the caller's IP address for per-client limits.
 */
export class ClientIp {
  private constructor() {}

  /**
   * Reads the trusted client IP header and returns the address in canonical form.
   * @param headers The request headers.
   * @param options Whether a missing or invalid header may fall back to loopback.
   * @returns The canonical IP address, or null when production has no trusted IP.
   */
  static fromHeaders(headers: Headers, options: ClientIpOptions): string | null {
    const address = ClientIp.canonical(headers.get(TRUSTED_CLIENT_IP_HEADER));
    if (address) {
      return address;
    }

    return options.allowLoopbackFallback ? LOOPBACK_IP : null;
  }

  /**
   * Canonicalizes an IP so equivalent spellings (`2001:db8::1`, `2001:0db8:0:…:1`) match.
   * @param value A header value that may hold one IP address.
   * @returns The canonical address, or null when the value is not exactly one IP.
   */
  static canonical(value: string | null): string | null {
    const version = value ? isIP(value) : 0;
    if (!value || !version) {
      return null;
    }

    const family = version === IPV6 ? "ipv6" : "ipv4";
    return new SocketAddress({ address: value, family }).address;
  }
}
