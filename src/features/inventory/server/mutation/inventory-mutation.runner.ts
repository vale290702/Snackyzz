import "server-only";

import { updateTag } from "next/cache";

import { getAdminContext, type AdminContext } from "@/features/access";
import { CapabilitySource, type Capability } from "@/shared/lib/capability";
import type { SharedErrorCode } from "@/shared/lib/result";
import { runAction, type ActionResult } from "@/shared/lib/run-action";

import { INVENTORY_CACHE_TAG } from "./mutation.constants";
import type { InventoryErrorCode } from "../../domain/errors";

/**
 * Runs a inventory capability for the admin signed in on the web, then expires the public
 * inventory reads.
 * @param name Stable action name, never user input.
 * @param capability The capability to run; it checks `inventory.manage` and parses the input.
 * @param input Untrusted input from the browser.
 * @returns The capability's result.
 * @throws Redirects to sign-in without an admin session.
 */
export async function runInventoryMutation<Value>(
  name: string,
  capability: Capability<AdminContext, Value, InventoryErrorCode>,
  input: unknown,
): Promise<ActionResult<Value, InventoryErrorCode>> {
  return runAction<Value, InventoryErrorCode | SharedErrorCode>(name, async (log) => {
    const context = await getAdminContext({ source: CapabilitySource.AdminWeb });
    log.step("loadContext");

    const result = await capability.run(context, input);
    if (!result.ok) {
      return result;
    }
    log.step("execute");

    updateTag(INVENTORY_CACHE_TAG);
    log.step("invalidate");

    return result;
  });
}
