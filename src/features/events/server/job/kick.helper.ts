import "server-only";

import { publicEnv } from "@/shared/config/env.public";
import { serverEnv } from "@/shared/config/env.server";
import { createLogger } from "@/shared/lib/logger";
import { Results, type Result } from "@/shared/lib/result";

import { EVENT_JOB_PATH, EVENT_KICK_TIMEOUT_MS } from "./job.constants";
import { EventError, type EventErrorCode } from "../../domain/errors/errors.constants";

/**
 * Requests a bounded delivery pass; call inside after() so the publisher commits first.
 * @returns A safe transport outcome; failed kicks leave events pending for a later job run.
 */
export async function kickEventConsumers(): Promise<Result<void, EventErrorCode>> {
  const log = createLogger({ operation: "events.kick" });
  log.step("requestJob");

  try {
    const response = await fetch(new URL(EVENT_JOB_PATH, publicEnv.NEXT_PUBLIC_SITE_URL), {
      method: "POST",
      headers: { authorization: `Bearer ${serverEnv.JOB_SECRET}` },
      signal: AbortSignal.timeout(EVENT_KICK_TIMEOUT_MS),
      redirect: "error",
    });
    if (response.ok) {
      log.step("jobAccepted");
      return Results.ok(undefined);
    }
  } catch {
    // The durable event remains pending; never log transport messages or the job credential.
  }

  log.error("jobUnavailable", { code: EventError.KickFailed });
  return Results.err(EventError.KickFailed);
}
