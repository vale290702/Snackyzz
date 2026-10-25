import "server-only";

import { createHmac } from "node:crypto";

import { serverEnv } from "@/shared/config/env.server";

import type { SigningScopeValue } from "./signing.types";

/**
 * HMAC-SHA256 with the media secret. Rotating the secret resets rate keys and invalidates receipts.
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
   * The secret as key bytes, for libraries that sign with it, such as jose for upload receipts.
   * @returns The HMAC key.
   */
  static key(): Uint8Array {
    return new TextEncoder().encode(serverEnv.MEDIA_SIGNING_SECRET);
  }

  private static digest(scope: SigningScopeValue, message: string): Buffer {
    return createHmac("sha256", serverEnv.MEDIA_SIGNING_SECRET)
      .update(`${scope}:${message}`)
      .digest();
  }
}
