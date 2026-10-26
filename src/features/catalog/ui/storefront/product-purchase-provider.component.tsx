"use client";

import type { ReactNode } from "react";

import {
  ProductPurchaseContext,
  type ProductPurchase,
} from "../../hooks/storefront/use-product-purchase.hook";

/**
 * Props for the purchase provider.
 */
type ProductPurchaseProviderProps = {
  purchase: ProductPurchase;
  children: ReactNode;
};

/**
 * Lets product cards and dialogs below it add variants to the cart.
 * @param props The cart's add handler and the storefront below it.
 * @returns The provider.
 */
export function ProductPurchaseProvider({ purchase, children }: ProductPurchaseProviderProps) {
  return <ProductPurchaseContext value={purchase}>{children}</ProductPurchaseContext>;
}
