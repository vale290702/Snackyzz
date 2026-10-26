"use client";

import { useState } from "react";

import { FormFieldKind, useFormAction } from "@/shared/lib/form-action";

import { CatalogFieldError } from "../../domain/fields";
import { variantFieldsInputSchema } from "../../domain/variants";
import type { Variant } from "../../index";
import { createVariantAction, updateVariantAction } from "../../server/variants/variants.actions";

/**
 * Props the variant form's hook needs.
 */
type VariantFormOptions = {
  productId: string;
  variant: Variant | null;
  onSaved: (variant: Variant) => void;
};

/**
 * State for the variant editor: adds a variant to the product, or replaces the one being edited.
 * Stock tracking is kept here so a failed save keeps the choice.
 * @param options The product, the variant being edited (null for a new one), and what to do once
 * it is saved.
 * @returns The form action and codes, and the stock-tracking choice with its handler.
 */
export function useVariantForm({ productId, variant, onSaved }: VariantFormOptions) {
  const [isStockTracked, setIsStockTracked] = useState(variant?.isStockTracked ?? true);

  const form = useFormAction({
    schema: variantFieldsInputSchema,
    action: async (input) => {
      const result = variant
        ? await updateVariantAction({ ...input, id: variant.id })
        : await createVariantAction({ ...input, productId });
      if (result.ok) {
        onSaved(result.value);
      }

      return result;
    },
    fieldErrorCodes: Object.values(CatalogFieldError),
    preserve: ["name", "sku", "price", "sortOrder"],
    fieldKinds: { isStockTracked: FormFieldKind.Checkbox },
  });

  return { ...form, isStockTracked, setIsStockTracked };
}
