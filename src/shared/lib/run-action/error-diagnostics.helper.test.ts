import { describe, expect, it, vi } from "vitest";

import { ErrorDiagnostics } from "./error-diagnostics.helper";

describe("ErrorDiagnostics", () => {
  it("keeps native error names and bounded SQLSTATE codes", () => {
    expect(ErrorDiagnostics.describe(new TypeError("private-input"))).toMatchObject({
      name: "TypeError",
    });
    expect(
      ErrorDiagnostics.describe({ name: "PostgrestError", code: "23505", message: "secret" }),
    ).toEqual({ name: "PostgrestError", code: "23505", stack: "", thrownType: "object" });
  });

  it("omits untrusted identifier contents and never invokes identifier getters", () => {
    expect(ErrorDiagnostics.describe({ name: "ana@example.test", code: "secret-token" })).toEqual({
      name: "UnknownError",
      stack: "",
      thrownType: "object",
    });
    const getter = vi.fn(() => "private-input");
    const error = Object.defineProperties({}, { name: { get: getter }, code: { get: getter } });
    expect(ErrorDiagnostics.describe(error)).toEqual({
      name: "UnknownError",
      stack: "",
      thrownType: "object",
    });
    expect(getter).not.toHaveBeenCalled();
    expect(ErrorDiagnostics.describe("private-input")).toMatchObject({
      name: "UnknownError",
      thrownType: "string",
    });
  });

  it("retains call locations without exception messages", () => {
    const error = new Error("private-input");
    error.stack = "Error: private-input\n    at execute (/app/sample.ts:10:2)";

    expect(ErrorDiagnostics.stackFrames(error)).toBe("    at execute (/app/sample.ts:10:2)");
  });

  it("returns no diagnostics for arbitrary payloads or missing stacks", () => {
    const error = new Error("private-input");
    delete error.stack;

    expect(ErrorDiagnostics.stackFrames(error)).toBe("");
    expect(ErrorDiagnostics.stackFrames({ stack: "private-input" })).toBe("");
    expect(ErrorDiagnostics.stackFrames(null)).toBe("");
  });
});
