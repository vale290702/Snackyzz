import type { Permission } from "@/features/access";

/**
 * How long a signed proof URL stays valid.
 */
export const PROOF_READ_SECONDS = 5 * 60;

/**
 * Staff who review orders may read their payment and refund proofs.
 */
export const PROOF_READ_PERMISSION = "orders.view" satisfies Permission;
