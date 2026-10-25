import { describe, expect, it } from "vitest";

import { err, isOk, ok } from "./result";

describe("result", () => {
  it("wraps a value", () => {
    const result = ok(42);

    expect(result).toEqual({ ok: true, value: 42 });
    expect(isOk(result)).toBe(true);
  });

  it("wraps an error without meta", () => {
    const result = err("out_of_stock");

    expect(result).toEqual({ ok: false, error: "out_of_stock" });
    expect("meta" in result).toBe(false);
    expect(isOk(result)).toBe(false);
  });

  it("keeps meta when given", () => {
    expect(err("invalid_input", { field: "phone" })).toEqual({
      ok: false,
      error: "invalid_input",
      meta: { field: "phone" },
    });
  });
});
