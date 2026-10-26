import { describe, expect, it } from "vitest";

import { FulfillmentResults } from "./database-result.helper";
import { PostgresErrorCode } from "./mutation.constants";
import { FulfillmentError } from "../../domain/errors";

describe("FulfillmentResults", () => {
  it("maps a taken zone name by constraint name", () => {
    const takenName = {
      code: PostgresErrorCode.UniqueViolation,
      message: 'duplicate key value violates unique constraint "delivery_zones_name_key"',
    };

    expect(FulfillmentResults.errorCode(takenName)).toBe(FulfillmentError.ZoneNameTaken);
  });

  it("maps exceptions raised by entry points by message", () => {
    const missingLocation = {
      code: PostgresErrorCode.RaisedException,
      message: "pickup_location_not_found",
    };

    expect(FulfillmentResults.fromError(missingLocation)).toEqual({
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

    expect(() => FulfillmentResults.fromError(overlap)).toThrow();
    expect(() => FulfillmentResults.fromError(unknownConstraint)).toThrow();
    expect(() => FulfillmentResults.fromError(permissionDenied)).toThrow();
  });
});
