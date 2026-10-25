import { describe, expect, it } from "vitest";

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
});
