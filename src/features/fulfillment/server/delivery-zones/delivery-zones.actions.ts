"use server";

import "server-only";

import type { ActionResult } from "@/shared/lib/run-action";

import {
  archiveDeliveryZoneCapability,
  createDeliveryZoneCapability,
  updateDeliveryZoneCapability,
} from "./delivery-zones.capability";
import type { DeliveryZone } from "./delivery-zones.types";
import type { FulfillmentErrorCode } from "../../domain/errors";
import { runFulfillmentMutation } from "../mutation";

/**
 * Creates a delivery zone for the signed-in fulfillment manager.
 * @param input Untrusted delivery zone fields.
 * @returns The zone, or why it was not created.
 * @throws Redirects to sign-in without an admin session.
 */
export async function createDeliveryZoneAction(
  input: unknown,
): Promise<ActionResult<DeliveryZone, FulfillmentErrorCode>> {
  return runFulfillmentMutation(
    "fulfillment.createDeliveryZone",
    createDeliveryZoneCapability,
    input,
  );
}

/**
 * Replaces an active delivery zone's fields.
 * @param input Untrusted zone id and fields.
 * @returns The zone, or why it was not updated.
 * @throws Redirects to sign-in without an admin session.
 */
export async function updateDeliveryZoneAction(
  input: unknown,
): Promise<ActionResult<DeliveryZone, FulfillmentErrorCode>> {
  return runFulfillmentMutation(
    "fulfillment.updateDeliveryZone",
    updateDeliveryZoneCapability,
    input,
  );
}

/**
 * Archives a delivery zone.
 * @param input Untrusted `{ id }`.
 * @returns The archived zone, or why it was not archived.
 * @throws Redirects to sign-in without an admin session.
 */
export async function archiveDeliveryZoneAction(
  input: unknown,
): Promise<ActionResult<DeliveryZone, FulfillmentErrorCode>> {
  return runFulfillmentMutation(
    "fulfillment.archiveDeliveryZone",
    archiveDeliveryZoneCapability,
    input,
  );
}
