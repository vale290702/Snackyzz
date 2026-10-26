"use client";

import { useTranslations } from "next-intl";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { FieldGroup } from "@/shared/ui/field";

import { FormAlert, SaveButton, TextareaField, TextField } from "./form-fields.component";
import { ImageField } from "./image-field.component";
import { useBrandForm } from "../../hooks/manager/use-brand-form.hook";
import type { ManagedBrand } from "../../index";

/**
 * Props for the brand form.
 */
type BrandFormProps = {
  brand: ManagedBrand | null;
  onSaved: () => void;
};

/**
 * Creates a brand, or edits the one passed in, with its storefront copy and logo.
 * @param props The brand being edited (null for a new one) and what to do once it is saved.
 * @returns The form.
 */
export function BrandForm({ brand, onSaved }: BrandFormProps) {
  const { formAction, isPending, values, fieldErrors, formError, logo, canSubmit } = useBrandForm({
    brand,
    onSaved,
  });
  const translate = useTranslations("catalog.manager");
  const errorMessage = useErrorMessage("catalog");

  return (
    <form action={formAction} aria-labelledby="catalog-editor-title" className="grid gap-6">
      <FieldGroup className="gap-5">
        <TextField
          id="brand-name"
          name="name"
          label={translate("fields.name")}
          required
          defaultValue={values.name ?? brand?.name ?? ""}
          error={errorMessage(fieldErrors.name)}
        />
        <TextField
          id="brand-slug"
          name="slug"
          label={translate("fields.slug")}
          hint={translate("fields.slugHint")}
          required
          defaultValue={values.slug ?? brand?.slug ?? ""}
          error={errorMessage(fieldErrors.slug)}
        />
        <TextField
          id="brand-tagline"
          name="tagline"
          label={translate("brandForm.tagline")}
          defaultValue={values.tagline ?? brand?.tagline ?? ""}
          error={errorMessage(fieldErrors.tagline)}
        />
        <TextareaField
          id="brand-description"
          name="description"
          label={translate("brandForm.description")}
          defaultValue={values.description ?? brand?.description ?? ""}
          error={errorMessage(fieldErrors.description)}
        />
        <TextField
          id="brand-label"
          name="label"
          label={translate("brandForm.label")}
          defaultValue={values.label ?? brand?.label ?? ""}
          error={errorMessage(fieldErrors.label)}
        />
        <ImageField
          id="brand-logo"
          name="logoFileId"
          label={translate("brandForm.logo")}
          hint={translate("image.logoHint")}
          image={logo}
        />
        <TextField
          id="brand-sort-order"
          name="sortOrder"
          type="number"
          min={0}
          label={translate("fields.sortOrder")}
          defaultValue={values.sortOrder ?? brand?.sortOrder ?? 0}
          error={errorMessage(fieldErrors.sortOrder)}
        />
      </FieldGroup>
      <FormAlert message={errorMessage(formError ?? fieldErrors.logoFileId)} />
      <SaveButton
        isPending={isPending}
        disabled={!canSubmit}
        label={translate("brandForm.submit")}
        pendingLabel={translate("actions.saving")}
      />
    </form>
  );
}
