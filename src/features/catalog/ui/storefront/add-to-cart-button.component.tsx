import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { addToCartVariants } from "./product-look.constants";
import type { ProductLookValue } from "./product-look.types";

/**
 * Props for the add-to-cart button.
 */
type AddToCartButtonProps = {
  canAdd: boolean;
  onAdd: () => void;
  look: ProductLookValue;
};

/**
 * Adds a product's variant to the cart; disabled until the cart is available.
 * @param props Whether adding works, the handler, and the card's look.
 * @returns The button.
 */
export function AddToCartButton({ canAdd, onAdd, look }: AddToCartButtonProps) {
  const translate = useTranslations("catalog.product");

  return (
    <button
      type="button"
      disabled={!canAdd}
      onClick={onAdd}
      className={addToCartVariants({ look })}
    >
      {translate("addToCart")}
      <Plus aria-hidden className="size-4.5" strokeWidth={1.7} />
    </button>
  );
}
