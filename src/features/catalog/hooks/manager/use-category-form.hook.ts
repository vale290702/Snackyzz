"use client";

import { useFormAction } from "@/shared/lib/form-action";

import { categoryInputSchema } from "../../domain/categories";
import { CatalogFieldError } from "../../domain/fields";
import type { Category } from "../../index";
import {
  createCategoryAction,
  updateCategoryAction,
} from "../../server/categories/categories.actions";

/**
 * Props the category form's hook needs.
 */
type CategoryFormOptions = {
  category: Category | null;
  onSaved: (category: Category) => void;
};

/**
 * State for the category editor: creates a category, or replaces the one being edited.
 * @param options The category being edited (null for a new one) and what to do once it is saved.
 * @returns The form action, pending flag, restored values and error codes.
 */
export function useCategoryForm({ category, onSaved }: CategoryFormOptions) {
  return useFormAction({
    schema: categoryInputSchema,
    action: async (input) => {
      const result = category
        ? await updateCategoryAction({ ...input, id: category.id })
        : await createCategoryAction(input);
      if (result.ok) {
        onSaved(result.value);
      }

      return result;
    },
    fieldErrorCodes: Object.values(CatalogFieldError),
    preserve: ["slug", "name", "sortOrder"],
  });
}
