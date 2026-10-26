"use client";

import { useTranslations } from "next-intl";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { FieldGroup } from "@/shared/ui/field";

import { AccentColorField } from "./accent-color-field.component";
import { FormAlert, SaveButton, TextareaField, TextField } from "./form-fields.component";
import { ImageField } from "./image-field.component";
import { InlinePresentationFields } from "./inline-presentation-fields.component";
import { ProductNameSlugFields } from "./product-name-slug-fields.component";
import { BrandSelectField, CategoryCheckboxes } from "./product-placement-fields.component";
import { useProductForm } from "../../hooks/manager/use-product-form.hook";
import type { Category, ManagedBrand, ManagedProduct, Product, Variant } from "../../index";

/**
 * Props for the product form.
 */
type ProductFormProps = {
  product: ManagedProduct | null;
  variants?: readonly Variant[];
  brands: readonly ManagedBrand[];
  categories: readonly Category[];
  defaultBrandId: string;
  onSaved: (product: Product) => void;
  onDirtyChange?: ((isDirty: boolean) => void) | undefined;
};

/**
 * Creates a product, or edits the one passed in: copy, brand, presentation, color, image and
 * categories.
 * @param props The product being edited (null for a new one), its variants, the brands and
 * categories, the brand a new product starts in, and the save and dirty callbacks.
 * @returns The form.
 */
export function ProductForm(props: ProductFormProps) {
  const translate = useTranslations("catalog.manager");
  const form = useProductForm({
    ...props,
    defaultPresentationName: translate("productForm.defaultPresentationName"),
  });
  const { form: fields, submit, isSubmitting, fieldErrors, formError } = form;
  const errorMessage = useErrorMessage("catalog");

  return (
    <form
      id="catalog-product-form"
      aria-busy={isSubmitting || form.image.isUploading}
      onSubmit={submit}
      aria-labelledby="catalog-editor-title"
      className="grid gap-6"
    >
      <FieldGroup className="gap-5">
        <ProductNameSlugFields form={form} />
        <BrandSelectField
          options={form.brandOptions}
          brandId={form.brandId}
          onChange={form.selectBrand}
          error={errorMessage(fieldErrors.brandId)}
        />
        {form.inlinePresentation && <InlinePresentationFields form={form} />}
        <TextareaField
          id="product-description"
          label={translate("fields.description")}
          required
          error={errorMessage(fieldErrors.description)}
          {...fields.register("description")}
        />
        <TextField
          id="product-badge"
          label={translate("productForm.badge")}
          error={errorMessage(fieldErrors.badge)}
          {...fields.register("badge")}
        />
        <AccentColorField
          color={form.accentColor}
          onColorChange={form.setAccentColor}
          error={errorMessage(fieldErrors.accentColor)}
        />
        <ImageField
          id="product-image"
          label={translate("productForm.image")}
          hint={translate("image.productHint")}
          image={form.image}
        />
        <details className="rounded-control border border-border p-4">
          <summary className="cursor-pointer text-sm font-semibold">
            {translate("productForm.moreOptions")}
          </summary>
          <CategoryCheckboxes
            options={form.categoryOptions}
            categoryIds={form.categoryIds}
            onToggle={form.toggleCategory}
            error={errorMessage(fieldErrors.categoryIds)}
          />
        </details>
      </FieldGroup>
      <ProductFormStatus form={form} isEditing={props.product !== null} />
      <FormAlert message={errorMessage(formError ?? fieldErrors.imageFileId)} />
      <SaveButton
        isPending={isSubmitting}
        disabled={!form.canSubmit}
        label={translate("productForm.submit")}
        pendingLabel={translate("actions.saving")}
      />
    </form>
  );
}

/**
 * Notes on a product saved without its presentation, or not on sale yet.
 * @param props The product form's state and whether an existing product is being edited.
 * @returns The status notes, or nothing.
 */
function ProductFormStatus({
  form,
  isEditing,
}: {
  form: ReturnType<typeof useProductForm>;
  isEditing: boolean;
}) {
  const translate = useTranslations("catalog.manager.productForm");

  return (
    <>
      {form.partialProductId && (
        <p role="status" className="text-sm text-muted-foreground">
          {translate("partialSave")}
        </p>
      )}
      {isEditing && !form.hasDefaultPresentation && (
        <p role="status" className="text-sm text-muted-foreground">
          {translate("notVisible")}
        </p>
      )}
    </>
  );
}
