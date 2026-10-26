"use client";

import { useTranslations } from "next-intl";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { FieldGroup } from "@/shared/ui/field";

import { FormAlert, SaveButton } from "./form-fields.component";
import { NameSlugFields } from "./name-slug-fields.component";
import { useCategoryForm } from "../../hooks/manager/use-category-form.hook";
import type { Category } from "../../index";

/**
 * Props for the category form.
 */
type CategoryFormProps = {
  category: Category | null;
  onSaved: () => void;
};

/**
 * Creates a category, or edits the one passed in.
 * @param props The category being edited (null for a new one) and what to do once it is saved.
 * @returns The form.
 */
export function CategoryForm({ category, onSaved }: CategoryFormProps) {
  const { formAction, isPending, values, fieldErrors, formError } = useCategoryForm({
    category,
    onSaved,
  });
  const translate = useTranslations("catalog.manager");
  const errorMessage = useErrorMessage("catalog");

  return (
    <form
      aria-busy={isPending}
      action={formAction}
      aria-labelledby="catalog-editor-title"
      className="grid gap-6"
    >
      <FieldGroup className="gap-5">
        <NameSlugFields
          prefix="category"
          name={values.name ?? category?.name ?? ""}
          slug={values.slug ?? category?.slug ?? ""}
          nameError={errorMessage(fieldErrors.name)}
          slugError={errorMessage(fieldErrors.slug)}
        />
        <input
          type="hidden"
          name="sortOrder"
          value={values.sortOrder ?? category?.sortOrder ?? 0}
        />
      </FieldGroup>
      <FormAlert message={errorMessage(formError)} />
      <SaveButton
        isPending={isPending}
        disabled={isPending}
        label={translate("categoryForm.submit")}
        pendingLabel={translate("actions.saving")}
      />
    </form>
  );
}
