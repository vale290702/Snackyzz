import { describe, expect, it } from "vitest";

import { FulfillmentDatabaseError } from "./database-error.helper";
import { PostgresErrorCode } from "./mutation.constants";
import { FulfillmentError } from "../../domain/errors";

describe("FulfillmentDatabaseError", () => {
  it("maps a taken zone name by constraint name", () => {
    const takenName = {
      code: PostgresErrorCode.UniqueViolation,
      message: 'duplicate key value violates unique constraint "delivery_zones_name_key"',
    };

    expect(FulfillmentDatabaseError.toCode(takenName)).toBe(FulfillmentError.ZoneNameTaken);
  });

  it("maps exceptions raised by entry points by message", () => {
    const missingLocation = {
      code: PostgresErrorCode.RaisedException,
      message: "pickup_location_not_found",
    };

    expect(FulfillmentDatabaseError.toFailure(missingLocation)).toEqual({
      ok: false,
      error: FulfillmentError.PickupLocationNotFound,
    });
  });

  it("rethrows unexpected errors, including overlapping hours and unknown constraints", () => {
    const overlap = {
      code: "23P01",
      message: 'conflicting key value violates exclusion constraint "delivery_hours_overlap_excl"',
    };
    const unknownConstraint = {
      code: PostgresErrorCode.UniqueViolation,
      message: 'duplicate key value violates unique constraint "delivery_zones_pkey"',
    };
    const permissionDenied = { code: "42501", message: "permission denied" };

    expect(() => FulfillmentDatabaseError.toFailure(overlap)).toThrow();
    expect(() => FulfillmentDatabaseError.toFailure(unknownConstraint)).toThrow();
    expect(() => FulfillmentDatabaseError.toFailure(permissionDenied)).toThrow();
  });
});
