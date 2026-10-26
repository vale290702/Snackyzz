"use client";

import { useTranslations } from "next-intl";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { FieldGroup } from "@/shared/ui/field";

import { AccentColorField } from "./accent-color-field.component";
import { FormAlert, SaveButton, TextareaField, TextField } from "./form-fields.component";
import { ImageField } from "./image-field.component";
import { InlinePresentationFields } from "./inline-presentation-fields.component";
import { NameSlugFields } from "./name-slug-fields.component";
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
};

/**
 * Creates a product, or edits the one passed in: copy, brand, categories, color and image.
 * @param props The product being edited (null for a new one), the brands and categories, the
 * brand a new product starts in, and what to do once it is saved.
 * @returns The form.
 */
export function ProductForm({
  product,
  variants = [],
  brands,
  categories,
  defaultBrandId,
  onSaved,
}: ProductFormProps) {
  const form = useProductForm({ product, variants, brands, categories, defaultBrandId, onSaved });
  const { formAction, isPending, values, fieldErrors, formError } = form;
  const translate = useTranslations("catalog.manager");
  const errorMessage = useErrorMessage("catalog");

  return (
    <form
      id="catalog-product-form"
      aria-busy={isPending || form.image.isUploading}
      action={formAction}
      aria-labelledby="catalog-editor-title"
      className="grid gap-6"
    >
      <FieldGroup className="gap-5">
        <NameSlugFields
          prefix="product"
          name={values.name ?? product?.name ?? ""}
          slug={values.slug ?? product?.slug ?? ""}
          nameError={errorMessage(fieldErrors.name)}
          slugError={errorMessage(fieldErrors.slug)}
        />
        <BrandSelectField
          options={form.brandOptions}
          brandId={form.brandId}
          onChange={form.selectBrand}
          error={errorMessage(fieldErrors.brandId)}
        />

        {form.inlinePresentation && <InlinePresentationFields form={form} />}
        <TextareaField
          id="product-description"
          name="description"
          label={translate("fields.description")}
          required
          defaultValue={values.description ?? product?.description ?? ""}
          error={errorMessage(fieldErrors.description)}
        />
        <TextField
          id="product-badge"
          name="badge"
          label={translate("productForm.badge")}
          defaultValue={values.badge ?? product?.badge ?? ""}
          error={errorMessage(fieldErrors.badge)}
        />
        <AccentColorField
          initialColor={form.accentColor}
          error={errorMessage(fieldErrors.accentColor)}
        />
        <ImageField
          id="product-image"
          name="imageFileId"
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
        <input type="hidden" name="sortOrder" value={values.sortOrder ?? product?.sortOrder ?? 0} />
      </FieldGroup>
      {form.partialProductId && (
        <p role="status" className="text-sm text-muted-foreground">
          {translate("productForm.partialSave")}
        </p>
      )}
      {product && !form.hasDefaultPresentation && (
        <p role="status" className="text-sm text-muted-foreground">
          {translate("productForm.notVisible")}
        </p>
      )}
      <FormAlert message={errorMessage(formError ?? fieldErrors.imageFileId)} />
      <SaveButton
        isPending={isPending}
        disabled={!form.canSubmit}
        label={translate("productForm.submit")}
        pendingLabel={translate("actions.saving")}
      />
    </form>
  );
}
