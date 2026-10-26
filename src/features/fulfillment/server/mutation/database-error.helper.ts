import type { z } from "zod";

import { Results, type Result } from "@/shared/lib/result";

import { DATABASE_FAILURES, PostgresErrorCode } from "./mutation.constants";
import type { DatabaseError, DatabaseResponse } from "./mutation.types";
import type { FulfillmentErrorCode } from "../../domain/errors";

const CONSTRAINT_NAME = /constraint "([^"]+)"/;

/**
 * Turns Postgres errors fulfillment expects (taken zone names, missing locations) into
 * fulfillment error codes. Anything else is a bug and is rethrown.
 */
export class FulfillmentDatabaseError {
  private constructor() {}

  /**
   * Finds the fulfillment code for a database error.
   * @param error The error PostgREST returned.
   * @returns The matching code, or null when the error is not an expected one.
   */
  static toCode(error: DatabaseError): FulfillmentErrorCode | null {
    const key = FulfillmentDatabaseError.failureKey(error);
    if (key === null) {
      return null;
    }

    return DATABASE_FAILURES[key] ?? null;
  }

  /**
   * Converts an expected database error into a failed result.
   * @param error The error PostgREST returned.
   * @returns The failed result.
   * @throws The original error when it is not an expected one.
   */
  static toFailure(error: DatabaseError): Result<never, FulfillmentErrorCode> {
    const code = FulfillmentDatabaseError.toCode(error);
    if (code === null) {
      throw error;
    }

    return Results.err(code);
  }

  /**
   * Converts a single-row write or read into a result.
   * @param response The PostgREST response.
   * @param rowSchema Parses the row into its record.
   * @param notFound The code for a missing row, such as one that is archived or hidden by RLS.
   * @returns The parsed record, `notFound`, or the expected database failure.
   * @throws When the database fails unexpectedly.
   */
  static toResult<Value>(
    response: DatabaseResponse,
    rowSchema: z.ZodType<Value>,
    notFound: FulfillmentErrorCode,
  ): Result<Value, FulfillmentErrorCode> {
    if (response.error) {
      return FulfillmentDatabaseError.toFailure(response.error);
    }

    if (response.data === null) {
      return Results.err(notFound);
    }

    return Results.ok(rowSchema.parse(response.data));
  }

  private static failureKey(error: DatabaseError): string | null {
    if (error.code === PostgresErrorCode.RaisedException) {
      return error.message;
    }

    if (error.code !== PostgresErrorCode.UniqueViolation) {
      return null;
    }

    return CONSTRAINT_NAME.exec(error.message)?.[1] ?? null;
  }
}
