"use client";

import { useTranslations } from "next-intl";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { FieldGroup } from "@/shared/ui/field";

import { FormAlert, SaveButton, TextareaField, TextField } from "./form-fields.component";
import { ImageField } from "./image-field.component";
import { NameSlugFields } from "./name-slug-fields.component";
import { useBrandForm } from "../../hooks/manager/use-brand-form.hook";
import type { ManagedBrand } from "../../index";

/**
 * Props for the brand form.
 */
type BrandFormProps = {
  brand: ManagedBrand | null;
  onSaved: () => void;
  onDirtyChange?: ((isDirty: boolean) => void) | undefined;
};

/**
 * Creates a brand, or edits the one passed in, with its storefront copy and logo.
 * @param props The brand being edited (null for a new one), what to do once it is saved, and who
 * to tell about unsaved changes.
 * @returns The form.
 */
export function BrandForm({ brand, onSaved, onDirtyChange }: BrandFormProps) {
  const { form, submit, isSubmitting, fieldErrors, formError, nameSlug, logo, canSubmit } =
    useBrandForm({ brand, onSaved, onDirtyChange });
  const translate = useTranslations("catalog.manager");
  const errorMessage = useErrorMessage("catalog");

  return (
    <form
      aria-busy={isSubmitting || logo.isUploading}
      onSubmit={submit}
      aria-labelledby="catalog-editor-title"
      className="grid gap-6"
    >
      <FieldGroup className="gap-5">
        <NameSlugFields
          prefix="brand"
          name={form.register("name", { onChange: nameSlug.nameChanged })}
          slug={form.register("slug")}
          isEditingSlug={nameSlug.isEditingSlug}
          onEditSlug={nameSlug.editSlug}
          nameError={errorMessage(fieldErrors.name)}
          slugError={errorMessage(fieldErrors.slug)}
        />
        <TextField
          id="brand-tagline"
          label={translate("brandForm.tagline")}
          error={errorMessage(fieldErrors.tagline)}
          {...form.register("tagline")}
        />
        <TextareaField
          id="brand-description"
          label={translate("brandForm.description")}
          error={errorMessage(fieldErrors.description)}
          {...form.register("description")}
        />
        <TextField
          id="brand-label"
          label={translate("brandForm.label")}
          error={errorMessage(fieldErrors.label)}
          {...form.register("label")}
        />
        <ImageField
          id="brand-logo"
          label={translate("brandForm.logo")}
          hint={translate("image.logoHint")}
          image={logo}
        />
      </FieldGroup>
      <FormAlert message={errorMessage(formError ?? fieldErrors.logoFileId)} />
      <SaveButton
        isPending={isSubmitting}
        disabled={!canSubmit}
        label={translate("brandForm.submit")}
        pendingLabel={translate("actions.saving")}
      />
    </form>
  );
}
