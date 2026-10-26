"use client";

import { useProductPurchase } from "./use-product-purchase.hook";
import { VariantSelection } from "../../domain/variants";
import type { ProductDto } from "../../index";

/**
 * State for a product card: the variant it shows and adds.
 * @param product The product on sale.
 * @returns The default variant and the add-to-cart handler for it.
 */
export function useProductCard(product: ProductDto) {
  const defaultVariant = VariantSelection.defaultOf(product.variants);
  const purchase = useProductPurchase(defaultVariant?.id ?? null);

  return { defaultVariant, ...purchase };
}
