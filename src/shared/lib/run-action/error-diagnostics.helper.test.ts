import { describe, expect, it } from "vitest";

import { ErrorDiagnostics } from "./error-diagnostics.helper";

describe("ErrorDiagnostics", () => {
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
