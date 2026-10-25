import { describe, expect, it } from "vitest";

import { ObjectPath } from "./object-path.helper";
import { FilePurpose, ImageMime } from "./upload-policy.constants";

describe("ObjectPath", () => {
  it("dates the key in UTC and uses the format's extension", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const newYearInCostaRica = new Date("2025-12-31T19:00:00-06:00");

    const path = ObjectPath.create(
      FilePurpose.ProductImage,
      ImageMime.Webp,
      newYearInCostaRica,
      id,
    );

    expect(path).toBe(`product_image/2026/01/${id}.webp`);
  });
});
