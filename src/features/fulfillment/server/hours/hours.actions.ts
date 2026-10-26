"use server";

import "server-only";

import type { ActionResult } from "@/shared/lib/run-action";

import { setDeliveryHoursCapability, setPickupLocationHoursCapability } from "./hours.capability";
import type { DeliveryHours, PickupLocationHours } from "./hours.types";
import type { FulfillmentErrorCode } from "../../domain/errors";
import { runFulfillmentMutation } from "../mutation";

/**
 * Replaces a pickup location's weekly hours for the signed-in fulfillment manager.
 * @param input Untrusted `{ pickupLocationId, hours }`.
 * @returns The location's hours, or why they were not replaced.
 * @throws Redirects to sign-in without an admin session.
 */
export async function setPickupLocationHoursAction(
  input: unknown,
): Promise<ActionResult<PickupLocationHours, FulfillmentErrorCode>> {
  return runFulfillmentMutation(
    "fulfillment.setPickupLocationHours",
    setPickupLocationHoursCapability,
    input,
  );
}

/**
 * Replaces the weekly delivery hours for the signed-in fulfillment manager.
 * @param input Untrusted `{ hours }`.
 * @returns The delivery hours, or why they were not replaced.
 * @throws Redirects to sign-in without an admin session.
 */
export async function setDeliveryHoursAction(
  input: unknown,
): Promise<ActionResult<DeliveryHours, FulfillmentErrorCode>> {
  return runFulfillmentMutation("fulfillment.setDeliveryHours", setDeliveryHoursCapability, input);
}
