import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useProductDialog } from "./use-product-dialog.hook";
import { CatalogRecords } from "../../ui/testing/catalog-records.helper";

const unit = CatalogRecords.variantDto();
const box = CatalogRecords.variantDto({ id: "variant-box", name: "Caja de 6", isDefault: false });

describe("useProductDialog", () => {
  it("starts on the default variant and offers no choice for one variant", () => {
    const { result } = renderHook(() => useProductDialog(CatalogRecords.productDto()));

    expect(result.current.selectedVariant).toEqual(unit);
    expect(result.current.hasChoice).toBe(false);
  });

  it("switches to the chosen variant", () => {
    const product = CatalogRecords.productDto({ variants: [unit, box] });
    const { result } = renderHook(() => useProductDialog(product));

    act(() => result.current.selectVariant(box.id));

    expect(result.current.hasChoice).toBe(true);
    expect(result.current.selectedVariant).toBe(box);
  });

  it("falls back to the default when the chosen variant is gone", () => {
    const { result, rerender } = renderHook(({ product }) => useProductDialog(product), {
      initialProps: { product: CatalogRecords.productDto({ variants: [unit, box] }) },
    });

    act(() => result.current.selectVariant(box.id));
    rerender({ product: CatalogRecords.productDto({ variants: [unit] }) });

    expect(result.current.selectedVariant).toEqual(unit);
  });
});
