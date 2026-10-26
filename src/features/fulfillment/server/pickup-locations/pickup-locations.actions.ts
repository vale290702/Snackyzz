"use server";

import "server-only";

import type { ActionResult } from "@/shared/lib/run-action";

import {
  archivePickupLocationCapability,
  createPickupLocationCapability,
  updatePickupLocationCapability,
} from "./pickup-locations.capability";
import type { PickupLocation } from "./pickup-locations.types";
import type { FulfillmentErrorCode } from "../../domain/errors";
import { runFulfillmentMutation } from "../mutation";

/**
 * Creates a pickup location for the signed-in fulfillment manager.
 * @param input Untrusted pickup location fields.
 * @returns The location, or why it was not created.
 * @throws Redirects to sign-in without an admin session.
 */
export async function createPickupLocationAction(
  input: unknown,
): Promise<ActionResult<PickupLocation, FulfillmentErrorCode>> {
  return runFulfillmentMutation(
    "fulfillment.createPickupLocation",
    createPickupLocationCapability,
    input,
  );
}

/**
 * Replaces an active pickup location's fields.
 * @param input Untrusted location id and fields.
 * @returns The location, or why it was not updated.
 * @throws Redirects to sign-in without an admin session.
 */
export async function updatePickupLocationAction(
  input: unknown,
): Promise<ActionResult<PickupLocation, FulfillmentErrorCode>> {
  return runFulfillmentMutation(
    "fulfillment.updatePickupLocation",
    updatePickupLocationCapability,
    input,
  );
}

/**
 * Archives a pickup location.
 * @param input Untrusted `{ id }`.
 * @returns The archived location, or why it was not archived.
 * @throws Redirects to sign-in without an admin session.
 */
export async function archivePickupLocationAction(
  input: unknown,
): Promise<ActionResult<PickupLocation, FulfillmentErrorCode>> {
  return runFulfillmentMutation(
    "fulfillment.archivePickupLocation",
    archivePickupLocationCapability,
    input,
  );
}
