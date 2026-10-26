"use client";

import { useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { z } from "zod";

import { FormFieldKind, useFormAction } from "@/shared/lib/form-action";

import { CatalogFieldError } from "../../domain/fields";
import { productEditorInputSchema } from "../../domain/products/product-editor.schema";
import type { ManagedProduct, Product, Variant } from "../../index";
import { createProductAction, updateProductAction } from "../../server/products/products.actions";
import { createVariantAction, updateVariantAction } from "../../server/variants/variants.actions";

type SubmissionOptions = {
  product: ManagedProduct | null;
  singleVariant: Variant | undefined;
  inlinePresentation: boolean;
  onSaved: (product: Product) => void;
};
type SaveContext = SubmissionOptions & {
  savedProductId: RefObject<string | null>;
  setPartialProductId: Dispatch<SetStateAction<string | null>>;
};

/**
 * Composes existing capabilities and retains a created product for a safe retry.
 * @param input Parsed product and inline presentation fields.
 * @param context Existing records and partial-save state.
 * @returns Complete product success or the failed capability's error.
 */
async function saveProduct(
  {
    presentationName,
    price,
    sku,
    isStockTracked: tracked,
    ...input
  }: z.infer<ReturnType<typeof productEditorInputSchema>>,
  context: SaveContext,
) {
  const id = context.savedProductId.current;
  const result = id
    ? await updateProductAction({ ...input, id })
    : await createProductAction(input);
  if (!result.ok) return result;
  context.savedProductId.current = result.value.id;

  if (context.inlinePresentation && presentationName !== undefined && price !== undefined) {
    const fields = {
      name: presentationName,
      price,
      sku,
      isStockTracked: tracked,
      sortOrder: context.singleVariant?.sortOrder ?? 0,
    };
    const presentation = context.singleVariant
      ? await updateVariantAction({ ...fields, id: context.singleVariant.id })
      : await createVariantAction({ ...fields, productId: result.value.id });
    if (!presentation.ok) {
      context.setPartialProductId(result.value.id);
      return presentation;
    }
  }
  context.setPartialProductId(null);
  context.onSaved(result.value);
  return result;
}

/**
 * Submits product fields through the standard form recipe, preserving partial saves.
 * @param options Current product, presentation and completion handler.
 * @returns Form state and the retained partial product id.
 */
export function useProductSubmission(options: SubmissionOptions) {
  const savedProductId = useRef<string | null>(options.product?.id ?? null);
  const [partialProductId, setPartialProductId] = useState<string | null>(null);
  const form = useFormAction({
    schema: productEditorInputSchema(options.inlinePresentation),
    action: (input) => saveProduct(input, { ...options, savedProductId, setPartialProductId }),
    fieldErrorCodes: Object.values(CatalogFieldError),
    preserve: [
      "slug",
      "name",
      "description",
      "badge",
      "accentColor",
      "sortOrder",
      "presentationName",
      "price",
      "sku",
    ],
    fieldKinds: { categoryIds: FormFieldKind.List, isStockTracked: FormFieldKind.Checkbox },
  });

  return { ...form, partialProductId };
}
