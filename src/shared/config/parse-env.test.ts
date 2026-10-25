import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseEnv } from "./parse-env";

const schema = z.object({
  API_URL: z.url(),
  API_KEY: z.string().min(1),
});

describe("parseEnv", () => {
  it("returns typed values when valid", () => {
    const env = parseEnv(schema, { API_URL: "https://example.com", API_KEY: "key" });

    expect(env).toEqual({ API_URL: "https://example.com", API_KEY: "key" });
  });

  it("names invalid variables without leaking values", () => {
    const parse = () => parseEnv(schema, { API_URL: "not-a-secret-url", API_KEY: undefined });

    expect(parse).toThrow("Invalid environment variables: API_URL, API_KEY");
    expect(parse).not.toThrow(/not-a-secret-url/);
  });
});
