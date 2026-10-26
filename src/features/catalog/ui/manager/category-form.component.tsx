"use client";

import { useTranslations } from "next-intl";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { FieldGroup } from "@/shared/ui/field";

import { FormAlert, SaveButton, TextField } from "./form-fields.component";
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
    <form action={formAction} aria-labelledby="catalog-editor-title" className="grid gap-6">
      <FieldGroup className="gap-5">
        <TextField
          id="category-name"
          name="name"
          label={translate("fields.name")}
          required
          defaultValue={values.name ?? category?.name ?? ""}
          error={errorMessage(fieldErrors.name)}
        />
        <TextField
          id="category-slug"
          name="slug"
          label={translate("fields.slug")}
          hint={translate("fields.slugHint")}
          required
          defaultValue={values.slug ?? category?.slug ?? ""}
          error={errorMessage(fieldErrors.slug)}
        />
        <TextField
          id="category-sort-order"
          name="sortOrder"
          type="number"
          min={0}
          label={translate("fields.sortOrder")}
          defaultValue={values.sortOrder ?? category?.sortOrder ?? 0}
          error={errorMessage(fieldErrors.sortOrder)}
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
