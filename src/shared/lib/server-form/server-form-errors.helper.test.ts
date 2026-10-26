import type { FieldErrors } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { ServerFormErrors } from ".";

describe("ServerFormErrors.fieldCodes", () => {
  it("keeps listed codes and turns other messages into invalid_input", () => {
    const codes = ServerFormErrors.fieldCodes(
      {
        name: { type: "too_small", message: "required" },
        price: { type: "invalid_type", message: "Expected number" },
        root: { server: { type: "server", message: "slug_taken" } },
      },
      ["required"],
    );

    expect(codes).toEqual({ name: "required", price: "invalid_input" });
  });

  it("reads the first item's message for list fields", () => {
    const codes = ServerFormErrors.fieldCodes(
      // React Hook Form reports list items as an array of item errors.
      {
        categoryIds: [undefined, { type: "invalid_format", message: "reference_invalid" }],
      } as unknown as FieldErrors,
      ["reference_invalid"],
    );

    expect(codes).toEqual({ categoryIds: "reference_invalid" });
  });
});
