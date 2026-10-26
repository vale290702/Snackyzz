"use client";

import { useRef, useState } from "react";

import { useProductPurchase } from "./use-product-purchase.hook";
import { VariantSelection } from "../../domain/variants";
import type { ProductDto } from "../../index";

/**
 * State for a product card: presentation summary, detail focus and direct purchase.
 * @param product The product on sale.
 * @returns Presentation summary, detail handlers and the default variant purchase handler.
 */
export function useProductCard(product: ProductDto) {
  const opener = useRef<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const summary = VariantSelection.summary(product.variants);
  const defaultVariant = VariantSelection.defaultOf(product.variants);
  const purchase = useProductPurchase(defaultVariant?.id ?? null);

  function rememberOpener(event: { target: EventTarget | null }) {
    if (event.target instanceof Element) {
      const trigger = event.target.closest<HTMLElement>('[data-slot="dialog-trigger"]');
      if (trigger) opener.current = trigger;
    }
  }

  function restoreFocus(event: Event) {
    event.preventDefault();
    opener.current?.focus();
  }

  return {
    rememberOpener,
    restoreFocus,
    defaultVariant,
    summary,
    isOpen,
    setIsOpen,
    choosePresentation: () => setIsOpen(true),
    ...purchase,
  };
}
