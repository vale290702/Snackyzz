"use client";

import { useErrorMessage } from "@/i18n/use-error-message.hook";

import { NameSlugFields } from "./name-slug-fields.component";
import type { useProductForm } from "../../hooks/manager/use-product-form.hook";

/**
 * The product's name and slug, wired to the product form.
 * @param props The product form's state.
 * @returns The name and slug fields.
 */
export function ProductNameSlugFields({ form }: { form: ReturnType<typeof useProductForm> }) {
  const errorMessage = useErrorMessage("catalog");

  return (
    <NameSlugFields
      prefix="product"
      name={form.form.register("name", { onChange: form.nameSlug.nameChanged })}
      slug={form.form.register("slug")}
      isEditingSlug={form.nameSlug.isEditingSlug}
      onEditSlug={form.nameSlug.editSlug}
      nameError={errorMessage(form.fieldErrors.name)}
      slugError={errorMessage(form.fieldErrors.slug)}
    />
  );
}
