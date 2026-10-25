import { describe, expect, it } from "vitest";

import { LogSanitizer } from "./log-sanitizer.helper";

describe("LogSanitizer", () => {
  it("preserves dates, identifiers and operational status fields", () => {
    const fields = {
      deliveryDate: "2026-10-25",
      chatId: "123456789",
      orderNumber: "10000234",
      numericChatId: 123456789,
      groupChatId: "-123456789",
      timestamp: "2026-10-25T12:30:00.000Z",
      emailSent: true,
      emailStatus: "sent",
      phoneVerified: false,
      paymentProofStatus: "pending",
      microphone: "enabled",
      voicemail: "ready",
    };
    expect(LogSanitizer.fields(fields)).toEqual(fields);
    expect(LogSanitizer.text("Delivery 2026-10-25 for 10000234")).toBe(
      "Delivery 2026-10-25 for 10000234",
    );
  });

  it("masks contact values by key without converting flags to strings", () => {
    expect(
      LogSanitizer.fields({
        customerEmail: "ana@example.test",
        customerPhone: "+506 8888-1234",
        customer_email: "ana@example.test",
        customer_phone: "88881234",
        phone: false,
        email: null,
        paymentProofUrl: "private-location",
      }),
    ).toEqual({
      customerEmail: "a***@example.test",
      customerPhone: "****1234",
      customer_email: "a***@example.test",
      customer_phone: "****1234",
      phone: false,
      email: null,
      paymentProofUrl: "[REDACTED]",
    });
  });

  it("scans embedded contacts and URLs on repeated calls", () => {
    const text =
      "Failed for ana@example.test and bob@example.test; call +506 8888-1234 at https://example.test/proof";
    const expected =
      "Failed for a***@example.test and b***@example.test; call +506 8888-1234 at [REDACTED_URL]";

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
