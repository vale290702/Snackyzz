"use server";

import "server-only";

import { adjustStockCapability } from "./stock.capability";
import { runInventoryMutation } from "../mutation";

/**
 * Sets stock to a validated quantity for the signed-in inventory manager.
 * @param input Untrusted variant, pool, target quantity and optional note.
 * @returns The updated pool or an expected failure.
 * @throws Redirects visitors to sign-in.
 */
export async function adjustStockAction(input: unknown) {
  return runInventoryMutation("inventory.adjustStock", adjustStockCapability, input);
}
