import "server-only";

import { headers } from "next/headers";

import { consumeRateLimit } from "@/integrations/supabase/rate-limit";
import { createServiceClient } from "@/integrations/supabase/service-client";
import { isProduction } from "@/shared/config/runtime";
import { ClientIp } from "@/shared/lib/client-ip";

import { UPLOAD_RATE_KEY_PREFIX, UPLOAD_RATE_LIMIT } from "./upload.constants";
import { MediaSigning, SigningScope } from "../signing";

/**
 * Admits this request against the per-IP upload limit. Fails closed: a request without a
 * trusted IP, or one the limiter cannot answer, is refused.
 * @returns Whether the caller may receive another upload URL.
 */
export async function admitUpload(): Promise<boolean> {
  const ip = ClientIp.fromHeaders(await headers(), { allowLoopbackFallback: !isProduction() });
  if (!ip) {
    return false;
  }

  // The key is an HMAC, so the limiter table never holds a reversible IP address.
  const key = UPLOAD_RATE_KEY_PREFIX + MediaSigning.sign(SigningScope.RateKey, ip);
  const result = await consumeRateLimit(createServiceClient(), { key, ...UPLOAD_RATE_LIMIT });

  return result.ok && result.value.admitted;
}
