import "server-only";

import { z } from "zod";

import type { AdminContext } from "@/features/access";
import { CapabilityKind, defineCapability } from "@/shared/lib/capability";

import { stockRepository } from "./stock.repository";
import { adjustStockInputSchema, stockLevelInputSchema } from "../../domain/stock";
import { InventoryPermission } from "../mutation";

/**
 * Sets a stock pool's available quantity through the atomic SQL writer.
 */
export const adjustStockCapability = defineCapability({
  name: "inventory.adjustStock",
  kind: CapabilityKind.Mutation,
  permission: InventoryPermission.Manage,
  input: adjustStockInputSchema,
  execute: (context: AdminContext, input) => stockRepository(context.client).adjust(input),
});

/**
 * Lists pools for an inventory manager.
 */
export const listStockLevelsCapability = defineCapability({
  name: "inventory.listStockLevels",
  kind: CapabilityKind.Query,
  permission: InventoryPermission.Manage,
  input: z.object({}),
  execute: (context: AdminContext) => stockRepository(context.client).listLevels(),
});

/**
 * Lists one pool's immutable ledger for an inventory manager.
 */
export const listMovementsCapability = defineCapability({
  name: "inventory.listMovements",
  kind: CapabilityKind.Query,
  permission: InventoryPermission.Manage,
  input: stockLevelInputSchema,
  execute: (context: AdminContext, input) =>
    stockRepository(context.client).listMovements(input.stockLevelId),
});
