"use client";

import { useController } from "react-hook-form";

import { useServerForm } from "@/shared/lib/server-form";

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
  onDirtyChange?: ((isDirty: boolean) => void) | undefined;
};

/**
 * State for the variant editor: adds a variant to the product, or replaces the one being edited.
 * @param options The product, the variant being edited (null for a new one), what to do once it is
 * saved, and who to tell about unsaved changes.
 * @returns The form, its submit handler and pending flag, the error codes, and the stock-tracking
 * choice with its handler.
 */
export function useVariantForm({ productId, variant, onSaved, onDirtyChange }: VariantFormOptions) {
  const server = useServerForm({
    schema: variantFieldsInputSchema,
    values: {
      name: variant?.name ?? "",
      price: variant?.price ?? "",
      sku: variant?.sku ?? "",
      isStockTracked: variant?.isStockTracked ?? true,
      sortOrder: variant?.sortOrder ?? 0,
    },
    action: (input) =>
      variant
        ? updateVariantAction({ ...input, id: variant.id })
        : createVariantAction({ ...input, productId }),
    fieldErrorCodes: Object.values(CatalogFieldError),
    onSuccess: onSaved,
    onDirtyChange,
  });
  const { field: stockTracked } = useController({
    control: server.form.control,
    name: "isStockTracked",
  });

  return {
    ...server,
    isStockTracked: stockTracked.value ?? true,
    setIsStockTracked: (checked: boolean) => stockTracked.onChange(checked),
  };
}
