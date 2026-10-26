import { describe, expect, it } from "vitest";

import { productEditorInputSchema } from "./product-editor.schema";

const product = {
  brandId: "00000000-0000-7000-8000-000000000001",
  name: "Galleta",
  slug: "galleta",
  description: "Chocolate",
  accentColor: "#ED781A",
  presentationName: "Unidad",
  price: "1500",
};

describe("product editor input", () => {
  it("requires a positive whole-colon initial presentation price", () => {
    expect(productEditorInputSchema(true).safeParse({ ...product, price: "" }).success).toBe(false);
    expect(productEditorInputSchema(true).safeParse(product).success).toBe(true);
  });
  it("does not require inline presentation fields for multiple presentations", () => {
    const fields = { ...product, presentationName: undefined, price: undefined };
    expect(productEditorInputSchema(false).safeParse(fields).success).toBe(true);
  });
});
