import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useProductCard } from "./use-product-card.hook";
import { ProductPurchaseContext } from "./use-product-purchase.hook";
import { CatalogRecords } from "../../ui/testing/catalog-records.helper";

describe("useProductCard", () => {
  it("opens presentation choice without purchasing the default", () => {
    const addToCart = vi.fn();
    const product = CatalogRecords.productDto({
      variants: [
        CatalogRecords.variantDto(),
        CatalogRecords.variantDto({ id: "box", isDefault: false }),
      ],
    });
    const { result } = renderHook(() => useProductCard(product), {
      wrapper: ({ children }) => (
        <ProductPurchaseContext value={{ addToCart }}>{children}</ProductPurchaseContext>
      ),
    });
    act(() => result.current.choosePresentation());
    expect(result.current.isOpen).toBe(true);
    expect(addToCart).not.toHaveBeenCalled();
  });

  it("directly adds the only presentation", () => {
    const addToCart = vi.fn();
    const product = CatalogRecords.productDto();
    const { result } = renderHook(() => useProductCard(product), {
      wrapper: ({ children }) => (
        <ProductPurchaseContext value={{ addToCart }}>{children}</ProductPurchaseContext>
      ),
    });
    act(() => result.current.addToCart());
    expect(addToCart).toHaveBeenCalledWith(product.variants[0]?.id);
    expect(result.current.isOpen).toBe(false);
  });

  it("shows the default variant", () => {
    const box = CatalogRecords.variantDto({ id: "variant-box", name: "Caja", isDefault: true });
    const unit = CatalogRecords.variantDto({ isDefault: false });
    const product = CatalogRecords.productDto({ variants: [unit, box] });

    const { result } = renderHook(() => useProductCard(product));

    expect(result.current.defaultVariant).toBe(box);
    expect(result.current.canAdd).toBe(false);
    act(() => result.current.choosePresentation());
    expect(result.current.isOpen).toBe(true);
    expect(result.current.summary.count).toBe(2);
  });
});
