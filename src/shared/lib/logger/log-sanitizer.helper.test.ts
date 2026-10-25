import { describe, expect, it } from "vitest";

import { LogSanitizer } from "./log-sanitizer.helper";

describe("LogSanitizer", () => {
  it("redacts a copy without mutating the supplied diagnostic fields", () => {
    const fields = Object.freeze({
      token: "private-token",
      email: "ana@example.test",
      phone: 88881234,
      count: 2,
      accepted: true,
    });

    expect(LogSanitizer.fields(fields)).toEqual({
      token: "[REDACTED]",
      email: "a***@example.test",
      phone: "****1234",
      count: 2,
      accepted: true,
    });
    expect(fields.token).toBe("private-token");
  });

  it("keeps UUIDs and already masked contacts intact", () => {
    const fields = {
      correlationId: "66d355c1-1234-4124-9f54-c6bda0c7fc12",
      email: "a***@example.test",
      phone: "****1234",
    };

    expect(LogSanitizer.fields(fields)).toEqual(fields);
  });
});
