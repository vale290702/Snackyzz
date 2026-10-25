import { describe, expect, it } from "vitest";

import { LogSanitizer } from "./log-sanitizer.helper";

describe("LogSanitizer", () => {
  it("scans embedded contacts and URLs on repeated calls", () => {
    const text =
      "Failed for ana@example.test and bob@example.test; call +506 8888-1234 at https://example.test/proof";
    const expected =
      "Failed for a***@example.test and b***@example.test; call ****1234 at [REDACTED_URL]";

    expect(LogSanitizer.text(text)).toBe(expected);
    expect(LogSanitizer.text(text)).toBe(expected);
  });

  it("redacts sensitive fields even when their values are invalid", () => {
    expect(
      LogSanitizer.fields({
        email: "ana..maria@example.test",
        phone: "not-a-phone",
        token: "not-a-token",
        proofUrl: "not-a-url",
      }),
    ).toEqual({
      email: "***",
      phone: "****",
      token: "[REDACTED]",
      proofUrl: "[REDACTED]",
    });
  });

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
