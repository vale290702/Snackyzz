import { describe, expect, it } from "vitest";

import { AccessError } from "@/features/access/domain/errors";
import { SignInFieldError } from "@/features/access/domain/sign-in";
import { CatalogError } from "@/features/catalog/domain/errors";
import { CatalogFieldError } from "@/features/catalog/domain/fields";
import { EventError } from "@/features/events/domain/errors/errors.constants";
import { FulfillmentError } from "@/features/fulfillment/domain/errors";
import { FulfillmentFieldError } from "@/features/fulfillment/domain/fields";
import { MediaError } from "@/features/media/domain/errors";
import type { SharedErrorCode } from "@/shared/lib/result";

import { defaultLocale, locales } from "./config";
import { loadMessages } from "./messages";

function collectKeys(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    collectKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("messages", () => {
  it("provides Spanish copy for every events error", async () => {
    const messages = await loadMessages(defaultLocale);
    expect(Object.keys(messages.errors.events).sort()).toEqual(Object.values(EventError).sort());
    for (const message of Object.values(messages.errors.events)) {
      expect(message.trim().length).toBeGreaterThan(0);
    }
  });

  it("provides Spanish copy for every media error", async () => {
    const messages = await loadMessages(defaultLocale);

    expect(Object.keys(messages.errors.media).sort()).toEqual(Object.values(MediaError).sort());
  });

  it("every locale has the same keys as the default locale", async () => {
    const expectedKeys = collectKeys(await loadMessages(defaultLocale)).sort();

    for (const locale of locales) {
      const keys = collectKeys(await loadMessages(locale)).sort();
      expect(keys, locale).toEqual(expectedKeys);
    }
  });

  it("provides Spanish copy for every shared error code", async () => {
    const messages = await loadMessages("es-CR");
    const copy: Record<SharedErrorCode, string> = messages.errors.shared;

    expect(Object.keys(copy).sort()).toEqual(["forbidden", "invalid_input", "unexpected"]);
    for (const message of Object.values(copy)) {
      expect(message.trim().length).toBeGreaterThan(0);
    }
  });

  it("provides Spanish copy for every access error and sign-in field code", async () => {
    const messages = await loadMessages("es-CR");
    const codes = [...Object.values(AccessError), ...Object.values(SignInFieldError)].sort();

    expect(Object.keys(messages.errors.access).sort()).toEqual(codes);
    for (const message of Object.values(messages.errors.access)) {
      expect(message.trim().length).toBeGreaterThan(0);
    }
  });

  it("provides Spanish copy for every catalog error and field code", async () => {
    const messages = await loadMessages("es-CR");
    const codes = [...Object.values(CatalogError), ...Object.values(CatalogFieldError)].sort();

    expect(Object.keys(messages.errors.catalog).sort()).toEqual(codes);
    for (const message of Object.values(messages.errors.catalog)) {
      expect(message.trim().length).toBeGreaterThan(0);
    }
  });

  it("provides Spanish copy for every fulfillment error and field code", async () => {
    const messages = await loadMessages("es-CR");
    const codes = [
      ...Object.values(FulfillmentError),
      ...Object.values(FulfillmentFieldError),
    ].sort();

    expect(Object.keys(messages.errors.fulfillment).sort()).toEqual(codes);
    for (const message of Object.values(messages.errors.fulfillment)) {
      expect(message.trim().length).toBeGreaterThan(0);
    }
  });
});
