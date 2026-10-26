"use client";

import { createContext, useContext } from "react";

/**
 * What the storefront does when a shopper adds a variant; the cart provides it.
 */
export type ProductPurchase = {
  addToCart: (variantId: string) => void;
};

/**
 * Where the cart plugs into product cards and dialogs; without a provider nothing can be added.
 */
export const ProductPurchaseContext = createContext<ProductPurchase | null>(null);

/**
 * Whether and how a shopper can add one variant to the cart.
 * @param variantId The variant the add button adds, or null when the product has none.
 * @returns `canAdd` and an `addToCart` handler that does nothing when adding is unavailable.
 */
export function useProductPurchase(variantId: string | null) {
  const purchase = useContext(ProductPurchaseContext);

  function addToCart() {
    if (purchase === null || variantId === null) {
      return;
    }

    purchase.addToCart(variantId);
  }

  return { canAdd: purchase !== null && variantId !== null, addToCart };
}
