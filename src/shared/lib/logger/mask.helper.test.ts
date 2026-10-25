import { describe, expect, it } from "vitest";

import { Mask } from "./mask.helper";

describe("Mask", () => {
  it("masks malformed and short contact values without exposing them", () => {
    expect(Mask.email("ana@example.test")).toBe("a***@example.test");
    expect(Mask.email("invalid")).toBe("***");
    expect(Mask.email("a@example.test")).toBe("***@example.test");
    expect(Mask.phone("+506 8888-1234")).toBe("****1234");
    expect(Mask.phone("1234")).toBe("****");
    expect(Mask.phone("")).toBe("****");
  });
});
