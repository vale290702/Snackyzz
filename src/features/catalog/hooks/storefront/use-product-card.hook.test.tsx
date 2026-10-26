import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useProductCard } from "./use-product-card.hook";
import { CatalogRecords } from "../../ui/testing/catalog-records.helper";

describe("useProductCard", () => {
  it("shows the default variant", () => {
    const box = CatalogRecords.variantDto({ id: "variant-box", name: "Caja", isDefault: true });
    const unit = CatalogRecords.variantDto({ isDefault: false });
    const product = CatalogRecords.productDto({ variants: [unit, box] });

    const { result } = renderHook(() => useProductCard(product));

    expect(result.current.defaultVariant).toBe(box);
    expect(result.current.canAdd).toBe(false);
  });
});
