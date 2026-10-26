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
  onDirtyChange?: ((isDirty: boolean) => void) | undefined;
};

/**
 * Creates a category, or edits the one passed in.
 * @param props The category being edited (null for a new one), what to do once it is saved, and
 * who to tell about unsaved changes.
 * @returns The form.
 */
export function CategoryForm({ category, onSaved, onDirtyChange }: CategoryFormProps) {
  const { form, submit, isSubmitting, fieldErrors, formError, nameSlug } = useCategoryForm({
    category,
    onSaved,
    onDirtyChange,
  });
  const translate = useTranslations("catalog.manager");
  const errorMessage = useErrorMessage("catalog");

  return (
    <form
      aria-busy={isSubmitting}
      onSubmit={submit}
      aria-labelledby="catalog-editor-title"
      className="grid gap-6"
    >
      <FieldGroup className="gap-5">
        <NameSlugFields
          prefix="category"
          name={form.register("name", { onChange: nameSlug.nameChanged })}
          slug={form.register("slug")}
          isEditingSlug={nameSlug.isEditingSlug}
          onEditSlug={nameSlug.editSlug}
          nameError={errorMessage(fieldErrors.name)}
          slugError={errorMessage(fieldErrors.slug)}
        />
      </FieldGroup>
      <FormAlert message={errorMessage(formError)} />
      <SaveButton
        isPending={isSubmitting}
        disabled={isSubmitting}
        label={translate("categoryForm.submit")}
        pendingLabel={translate("actions.saving")}
      />
    </form>
  );
}
