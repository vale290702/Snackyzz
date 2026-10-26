"use server";

import "server-only";

import type { ActionResult } from "@/shared/lib/run-action";

import { updateFulfillmentSettingsCapability } from "./settings.capability";
import type { FulfillmentSettings } from "./settings.types";
import type { FulfillmentErrorCode } from "../../domain/errors";
import { runFulfillmentMutation } from "../mutation";

/**
 * Updates the fulfillment settings for the signed-in fulfillment manager.
 * @param input Untrusted settings.
 * @returns The settings, or why they were not updated.
 * @throws Redirects to sign-in without an admin session.
 */
export async function updateFulfillmentSettingsAction(
  input: unknown,
): Promise<ActionResult<FulfillmentSettings, FulfillmentErrorCode>> {
  return runFulfillmentMutation(
    "fulfillment.updateSettings",
    updateFulfillmentSettingsCapability,
    input,
  );
}
