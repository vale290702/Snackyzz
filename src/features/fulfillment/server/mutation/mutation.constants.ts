import type { Permission } from "@/features/access";

import { FulfillmentError, type FulfillmentErrorCode } from "../../domain/errors";

/**
 * The permission every fulfillment capability requires.
 */
export const FulfillmentPermission = {
  Manage: "fulfillment.manage",
} as const satisfies Record<string, Permission>;

/**
 * Cache tag of every public fulfillment read; admin mutations expire it.
 */
export const FULFILLMENT_CACHE_TAG = "fulfillment";

/**
 * Postgres error codes fulfillment maps to expected failures.
 */
export const PostgresErrorCode = {
  RaisedException: "P0001",
  UniqueViolation: "23505",
} as const;

/**
 * Expected database failures, keyed by violated constraint or by the message an entry point
 * raises. Inverted and overlapping hours are refused by the input schemas first, so their
 * constraints are not listed: reaching them is a bug.
 */
export const DATABASE_FAILURES: Readonly<Record<string, FulfillmentErrorCode>> = {
  delivery_zones_name_key: FulfillmentError.ZoneNameTaken,
  pickup_location_not_found: FulfillmentError.PickupLocationNotFound,
};
