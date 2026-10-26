import "server-only";

import { updateTag } from "next/cache";

import { getAdminContext, type AdminContext } from "@/features/access";
import { CapabilitySource, type Capability } from "@/shared/lib/capability";
import type { SharedErrorCode } from "@/shared/lib/result";
import { runAction, type ActionResult } from "@/shared/lib/run-action";

import { FULFILLMENT_CACHE_TAG } from "./mutation.constants";
import type { FulfillmentErrorCode } from "../../domain/errors";

/**
 * Runs a fulfillment capability for the admin signed in on the web, then expires the public
 * fulfillment reads.
 * @param name Stable action name, never user input.
 * @param capability The capability to run; it checks `fulfillment.manage` and parses the input.
 * @param input Untrusted input from the browser.
 * @returns The capability's result.
 * @throws Redirects to sign-in without an admin session.
 */
export async function runFulfillmentMutation<Value>(
  name: string,
  capability: Capability<AdminContext, Value, FulfillmentErrorCode>,
  input: unknown,
): Promise<ActionResult<Value, FulfillmentErrorCode>> {
  return runAction<Value, FulfillmentErrorCode | SharedErrorCode>(name, async (log) => {
    const context = await getAdminContext({ source: CapabilitySource.AdminWeb });
    log.step("loadContext");

    const result = await capability.run(context, input);
    if (!result.ok) {
      return result;
    }
    log.step("execute");

    updateTag(FULFILLMENT_CACHE_TAG);
    log.step("invalidate");

    return result;
  });
}
