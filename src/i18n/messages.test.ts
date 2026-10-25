import { describe, expect, it } from "vitest";

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
});
