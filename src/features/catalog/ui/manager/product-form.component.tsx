"use client";

import { useTranslations } from "next-intl";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { FieldGroup } from "@/shared/ui/field";

import { FormAlert, SaveButton, TextareaField, TextField } from "./form-fields.component";
import { ImageField } from "./image-field.component";
import { BrandSelectField, CategoryCheckboxes } from "./product-placement-fields.component";
import { useProductForm } from "../../hooks/manager/use-product-form.hook";
import type { Category, ManagedBrand, ManagedProduct, Product } from "../../index";

/**
 * Props for the product form.
 */
type ProductFormProps = {
  product: ManagedProduct | null;
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
  brands,
  categories,
  defaultBrandId,
  onSaved,
}: ProductFormProps) {
  const form = useProductForm({ product, brands, categories, defaultBrandId, onSaved });
  const { formAction, isPending, values, fieldErrors, formError } = form;
  const translate = useTranslations("catalog.manager");
  const errorMessage = useErrorMessage("catalog");

  return (
    <form action={formAction} aria-labelledby="catalog-editor-title" className="grid gap-6">
      <FieldGroup className="gap-5">
        <TextField
          id="product-name"
          name="name"
          label={translate("fields.name")}
          required
          defaultValue={values.name ?? product?.name ?? ""}
          error={errorMessage(fieldErrors.name)}
        />
        <TextField
          id="product-slug"
          name="slug"
          label={translate("fields.slug")}
          hint={translate("fields.slugHint")}
          required
          defaultValue={values.slug ?? product?.slug ?? ""}
          error={errorMessage(fieldErrors.slug)}
        />
        <BrandSelectField
          options={form.brandOptions}
          brandId={form.brandId}
          onChange={form.selectBrand}
          error={errorMessage(fieldErrors.brandId)}
        />
        <CategoryCheckboxes
          options={form.categoryOptions}
          categoryIds={form.categoryIds}
          onToggle={form.toggleCategory}
          error={errorMessage(fieldErrors.categoryIds)}
        />
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
        <TextField
          id="product-accent-color"
          name="accentColor"
          type="color"
          label={translate("productForm.accentColor")}
          defaultValue={form.accentColor}
          error={errorMessage(fieldErrors.accentColor)}
          className="w-24 p-1.5"
        />
        <ImageField
          id="product-image"
          name="imageFileId"
          label={translate("productForm.image")}
          hint={translate("image.productHint")}
          image={form.image}
        />
        <TextField
          id="product-sort-order"
          name="sortOrder"
          type="number"
          min={0}
          label={translate("fields.sortOrder")}
          defaultValue={values.sortOrder ?? product?.sortOrder ?? 0}
          error={errorMessage(fieldErrors.sortOrder)}
        />
      </FieldGroup>
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
