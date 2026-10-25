import "server-only";

import { Results, type Result } from "@/shared/lib/result";

import { RateLimitError } from "./rate-limit.constants";
import type { RateLimitDecision, RateLimitErrorCode, RateLimitRule } from "./rate-limit.types";
import type { DatabaseClient } from "../database-client.types";

const FIRST_SERVER_ERROR_STATUS = 500;
const NETWORK_FAILURE_STATUS = 0;

/**
 * Consumes one request slot atomically in `private.rate_limits`.
 * @param client A service-role client; the function is not granted to API roles.
 * @param rule The caller's key and limit.
 * @returns The admission decision, or why the limiter could not answer.
 */
export async function consumeRateLimit(
  client: DatabaseClient,
  rule: RateLimitRule,
): Promise<Result<RateLimitDecision, RateLimitErrorCode>> {
  const { data, error, status } = await client.rpc("consume_rate_limit", {
    rate_key: rule.key,
    max_requests: rule.maxRequests,
    window_seconds: rule.windowSeconds,
  });

  if (error) {
    const isRetryable = status === NETWORK_FAILURE_STATUS || status >= FIRST_SERVER_ERROR_STATUS;
    return Results.err(isRetryable ? RateLimitError.Retryable : RateLimitError.Permanent);
  }

  return Results.ok({ admitted: data });
}
