import "server-only";

import { updateTag } from "next/cache";

import { getAdminContext, type AdminContext } from "@/features/access";
import { CapabilitySource, type Capability } from "@/shared/lib/capability";
import type { SharedErrorCode } from "@/shared/lib/result";
import { runAction, type ActionResult } from "@/shared/lib/run-action";

import { CATALOG_CACHE_TAG } from "./mutation.constants";
import type { CatalogErrorCode } from "../../domain/errors";

/**
 * Runs a catalog capability for the admin signed in on the web, then expires the storefront cache.
 * @param name Stable action name, never user input.
 * @param capability The capability to run; it checks `catalog.manage` and parses the input.
 * @param input Untrusted input from the browser.
 * @returns The capability's result.
 * @throws Redirects to sign-in without an admin session.
 */
export async function runCatalogMutation<Value>(
  name: string,
  capability: Capability<AdminContext, Value, CatalogErrorCode>,
  input: unknown,
): Promise<ActionResult<Value, CatalogErrorCode>> {
  return runAction<Value, CatalogErrorCode | SharedErrorCode>(name, async (log) => {
    const context = await getAdminContext({ source: CapabilitySource.AdminWeb });
    log.step("loadContext");

    const result = await capability.run(context, input);
    if (!result.ok) {
      return result;
    }
    log.step("execute");

    updateTag(CATALOG_CACHE_TAG);
    log.step("invalidate");

    return result;
  });
}
