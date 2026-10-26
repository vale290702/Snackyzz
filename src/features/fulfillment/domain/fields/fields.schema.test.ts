import { describe, expect, it } from "vitest";
import type { z } from "zod";

import { FulfillmentFieldError, INTEGER_MAX, MAP_URL_MAX_LENGTH } from "./fields.constants";
import { FulfillmentFields, recordIdInputSchema } from "./fields.schema";

function firstIssue(schema: z.ZodType, input: unknown): string | undefined {
  const parsed = schema.safeParse(input);

  return parsed.success ? undefined : parsed.error.issues[0]?.message;
}

describe("FulfillmentFields.mapUrl", () => {
  it("accepts https links and turns blank or missing links into null", () => {
    expect(FulfillmentFields.mapUrl.parse(" https://maps.google.com/?q=Escazu ")).toBe(
      "https://maps.google.com/?q=Escazu",
    );
    expect(FulfillmentFields.mapUrl.parse("  ")).toBeNull();
    expect(FulfillmentFields.mapUrl.parse(undefined)).toBeNull();
  });

  it("reports map_url_invalid for plain http and non-links", () => {
    for (const url of ["http://maps.google.com", "maps.google.com", "javascript:alert(1)"]) {
      expect(firstIssue(FulfillmentFields.mapUrl, url), url).toBe(
        FulfillmentFieldError.MapUrlInvalid,
      );
    }
  });

  it("reports field_too_long past the SQL limit", () => {
    const longUrl = `https://maps.google.com/?q=${"a".repeat(MAP_URL_MAX_LENGTH)}`;

    expect(firstIssue(FulfillmentFields.mapUrl, longUrl)).toBe(FulfillmentFieldError.TooLong);
  });
});

describe("FulfillmentFields.fee", () => {
  it("accepts whole colones from zero, coercing form text", () => {
    expect(FulfillmentFields.fee.parse("1500")).toBe(1500);
    expect(FulfillmentFields.fee.parse(0)).toBe(0);
  });

  it("reports fee_invalid for negative, fractional, oversized and non-numeric fees", () => {
    for (const fee of [-1, 1.5, INTEGER_MAX + 1, "gratis"]) {
      expect(firstIssue(FulfillmentFields.fee, fee), String(fee)).toBe(
        FulfillmentFieldError.FeeInvalid,
      );
    }
  });
});

describe("FulfillmentFields.weekday and time", () => {
  it("accept ISO weekdays and HH:MM times", () => {
    expect(FulfillmentFields.weekday.parse("7")).toBe(7);
    expect(FulfillmentFields.time.parse("09:30")).toBe("09:30");
  });

  it("report weekday_invalid and time_invalid", () => {
    for (const weekday of [0, 8, 1.5]) {
      expect(firstIssue(FulfillmentFields.weekday, weekday), String(weekday)).toBe(
        FulfillmentFieldError.WeekdayInvalid,
      );
    }
    for (const time of ["9:30", "24:00", "09:60", "09:30:00"]) {
      expect(firstIssue(FulfillmentFields.time, time), time).toBe(
        FulfillmentFieldError.TimeInvalid,
      );
    }
  });
});

describe("FulfillmentFields text", () => {
  it("trims required text and stores blank optional text as null", () => {
    expect(FulfillmentFields.requiredText(10).parse(" Escazú ")).toBe("Escazú");
    expect(FulfillmentFields.optionalText(10).parse(" ")).toBeNull();
  });

  it("reports field_required and field_too_long", () => {
    expect(firstIssue(FulfillmentFields.requiredText(10), " ")).toBe(
      FulfillmentFieldError.Required,
    );
    expect(firstIssue(FulfillmentFields.optionalText(3), "abcd")).toBe(
      FulfillmentFieldError.TooLong,
    );
  });
});

describe("recordIdInputSchema", () => {
  it("reports reference_invalid for malformed ids", () => {
    expect(firstIssue(recordIdInputSchema, { id: "not-a-uuid" })).toBe(
      FulfillmentFieldError.ReferenceInvalid,
    );
  });
});
