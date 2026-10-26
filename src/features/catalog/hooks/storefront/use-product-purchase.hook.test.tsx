import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { ProductPurchaseContext, useProductPurchase } from "./use-product-purchase.hook";

function withCart(addToCart: (variantId: string) => void) {
  return function CartProvider({ children }: { children: ReactNode }) {
    return <ProductPurchaseContext value={{ addToCart }}>{children}</ProductPurchaseContext>;
  };
}

describe("useProductPurchase", () => {
  it("can't add anything until the cart provides a purchase", () => {
    const { result } = renderHook(() => useProductPurchase("variant-unit"));

    expect(result.current.canAdd).toBe(false);
    act(() => result.current.addToCart());
  });

  it("adds the variant through the cart", () => {
    const addToCart = vi.fn();
    const { result } = renderHook(() => useProductPurchase("variant-unit"), {
      wrapper: withCart(addToCart),
    });

    act(() => result.current.addToCart());

    expect(result.current.canAdd).toBe(true);
    expect(addToCart).toHaveBeenCalledWith("variant-unit");
  });

  it("adds nothing for a product without a variant", () => {
    const addToCart = vi.fn();
    const { result } = renderHook(() => useProductPurchase(null), {
      wrapper: withCart(addToCart),
    });

    act(() => result.current.addToCart());

    expect(result.current.canAdd).toBe(false);
    expect(addToCart).not.toHaveBeenCalled();
  });
});
