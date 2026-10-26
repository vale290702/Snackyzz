"use client";

import { useServerForm } from "@/shared/lib/server-form";

import { useNameSlugFields } from "./use-name-slug-fields.hook";
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
  onDirtyChange?: ((isDirty: boolean) => void) | undefined;
};

/**
 * State for the category editor: creates a category, or replaces the one being edited.
 * @param options The category being edited (null for a new one), what to do once it is saved, and
 * who to tell about unsaved changes.
 * @returns The form, its submit handler and error codes, and the name and slug handlers.
 */
export function useCategoryForm({ category, onSaved, onDirtyChange }: CategoryFormOptions) {
  const server = useServerForm({
    schema: categoryInputSchema,
    values: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      sortOrder: category?.sortOrder ?? 0,
    },
    action: (input) =>
      category ? updateCategoryAction({ ...input, id: category.id }) : createCategoryAction(input),
    fieldErrorCodes: Object.values(CatalogFieldError),
    onSuccess: onSaved,
    onDirtyChange,
  });
  const nameSlug = useNameSlugFields({
    initialSlug: category?.slug ?? "",
    setSlug: (slug) => server.form.setValue("slug", slug, { shouldDirty: true }),
  });

  return { ...server, nameSlug };
}
