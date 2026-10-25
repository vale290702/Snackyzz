import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/shared/config/env.server";

import type { SigningScopeValue } from "./signing.types";

/**
 * HMAC-SHA256 signatures with the media secret. Rotating the secret invalidates them all.
 */
export class MediaSigning {
  private constructor() {}

  /**
   * Signs a message for one use.
   * @param scope What the signature is for.
   * @param message The message to sign.
   * @returns A base64url signature.
   */
  static sign(scope: SigningScopeValue, message: string): string {
    return MediaSigning.digest(scope, message).toString("base64url");
  }

  /**
   * Checks a signature in constant time.
   * @param scope What the signature must have been made for.
   * @param message The signed message.
   * @param signature The base64url signature to check.
   * @returns Whether the signature is authentic.
   */
  static verify(scope: SigningScopeValue, message: string, signature: string): boolean {
    const expected = MediaSigning.digest(scope, message);
    const actual = Buffer.from(signature, "base64url");

    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  private static digest(scope: SigningScopeValue, message: string): Buffer {
    return createHmac("sha256", serverEnv.MEDIA_SIGNING_SECRET)
      .update(`${scope}:${message}`)
      .digest();
  }
}
