import "server-only";

import { getAdminContext } from "@/features/access";
import { CapabilitySource } from "@/shared/lib/capability";

import { listMovementsCapability, listStockLevelsCapability } from "./stock.capability";

/**
 * Lists stock pools after authorizing the current admin.
 * @returns Stock records or a permission failure.
 * @throws Redirects visitors to sign-in.
 */
export async function listStockLevels() {
  const context = await getAdminContext({ source: CapabilitySource.AdminWeb });

  return listStockLevelsCapability.run(context, {});
}

/**
 * Lists an authorized pool's ledger, newest first.
 * @param stockLevelId The pool reference to validate.
 * @returns Ledger entries or a permission/input failure.
 * @throws Redirects visitors to sign-in.
 */
export async function listMovements(stockLevelId: string) {
  const context = await getAdminContext({ source: CapabilitySource.AdminWeb });

  return listMovementsCapability.run(context, { stockLevelId });
}
