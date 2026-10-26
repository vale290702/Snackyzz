"use client";

import { useState } from "react";

import { useProductPurchase } from "./use-product-purchase.hook";
import { VariantSelection } from "../../domain/variants";
import type { ProductDto } from "../../index";

/**
 * State for a product's detail dialog: which variant the shopper picked.
 * @param product The product on sale.
 * @returns The selected variant, whether there is a choice, a handler to pick one, and add-to-cart.
 */
export function useProductDialog(product: ProductDto) {
  const [variantId, setVariantId] = useState<string | null>(null);

  const selectedVariant = VariantSelection.chosen(product.variants, variantId);
  const purchase = useProductPurchase(selectedVariant?.id ?? null);

  return {
    selectedVariant,
    hasChoice: VariantSelection.hasChoice(product.variants),
    selectVariant: setVariantId,
    ...purchase,
  };
}
