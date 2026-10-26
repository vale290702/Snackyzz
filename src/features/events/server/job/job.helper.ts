import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { serverEnv } from "@/shared/config/env.server";

/**
 * Authorizes the server job without comparing variable-length secret buffers.
 */
export class EventJob {
  private constructor() {}

  /**
   * Checks the bearer header before any privileged job work.
   * @param request The incoming server request.
   * @returns Whether the configured job secret matches.
   */
  static isAuthorized(request: Request): boolean {
    const expected = `Bearer ${serverEnv.JOB_SECRET}`;
    const supplied = request.headers.get("authorization") ?? "";

    return timingSafeEqual(
      createHash("sha256").update(expected).digest(),
      createHash("sha256").update(supplied).digest(),
    );
  }
}
