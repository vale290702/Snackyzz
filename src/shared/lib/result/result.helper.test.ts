import { describe, expect, it } from "vitest";

import { err, isOk, ok, Results } from ".";

describe("result", () => {
  it("wraps a value", () => {
    const result = Results.ok(42);

    expect(result).toEqual({ ok: true, value: 42 });
    expect(Results.isOk(result)).toBe(true);
  });

  it("wraps an error without meta", () => {
    const result = Results.err("out_of_stock");

    expect(result).toEqual({ ok: false, error: "out_of_stock" });
    expect("meta" in result).toBe(false);
    expect(Results.isOk(result)).toBe(false);
  });

  it("keeps meta when given", () => {
    expect(err("invalid_input", { field: "phone" })).toEqual({
      ok: false,
      error: "invalid_input",
      meta: { field: "phone" },
    });
  });

  it("keeps the original function entry points available", () => {
    expect(ok).toBe(Results.ok);
    expect(err).toBe(Results.err);
    expect(isOk).toBe(Results.isOk);
  });
});
