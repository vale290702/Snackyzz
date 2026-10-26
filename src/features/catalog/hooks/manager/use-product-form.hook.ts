"use client";

import { useState } from "react";
import { useController, type UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import { Results } from "@/shared/lib/result";
import { useServerForm, type ServerFormValues } from "@/shared/lib/server-form";

import { useCatalogImageUpload } from "./use-catalog-image-upload.hook";
import { useNameSlugFields } from "./use-name-slug-fields.hook";
import { CatalogFieldError } from "../../domain/fields";
import { CatalogImagePurpose } from "../../domain/images";
import { ManagerRecords, NEW_PRODUCT_ACCENT_COLOR } from "../../domain/manager";
import { productEditorInputSchema } from "../../domain/products";
import type { Category, ManagedBrand, ManagedProduct, Product, Variant } from "../../index";
import { saveProductAction } from "../../server/products/products.actions";

/**
 * Props the product form's hook needs.
 */
type ProductFormOptions = {
  product: ManagedProduct | null;
  variants?: readonly Variant[];
  brands: readonly ManagedBrand[];
  categories: readonly Category[];
  defaultBrandId: string;
  defaultPresentationName: string;
  onSaved: (product: Product) => void;
  onDirtyChange?: ((isDirty: boolean) => void) | undefined;
};

/**
 * The product editor's schema, with or without its inline presentation.
 */
type ProductEditorSchema = ReturnType<typeof productEditorInputSchema>;

/**
 * The product editor's React Hook Form form.
 */
type ProductEditorForm = UseFormReturn<
  ServerFormValues<ProductEditorSchema>,
  unknown,
  z.output<ProductEditorSchema>
>;

/**
 * Presentation values for a product with several presentations, which the editor doesn't show.
 */
const NO_INLINE_PRESENTATION = {
  presentationName: undefined,
  price: undefined,
  sku: undefined,
  isStockTracked: undefined,
};

/**
 * The records a product can be placed in: active ones, plus any it already uses.
 * @param records Every brand or category.
 * @param chosenIds The ids the product uses now.
 * @returns The records to offer, in their order.
 */
function choosable<Record extends { id: string; archivedAt: string | null }>(
  records: readonly Record[],
  chosenIds: readonly string[],
): Record[] {
  return records.filter(
    (record) => ManagerRecords.isActive(record) || chosenIds.includes(record.id),
  );
}

/**
 * The form's values for a product and, while it has at most one, its presentation; or a new
 * product's defaults. Presentation fields are left out once the product has several.
 * @param options The product, its only presentation, whether presentation fields are shown, and
 * the new product's brand and presentation name.
 * @returns The values the form starts from and resyncs to.
 */
function productValues({
  product,
  singleVariant,
  inlinePresentation,
  defaultBrandId,
  defaultPresentationName,
}: Pick<ProductFormOptions, "product" | "defaultBrandId" | "defaultPresentationName"> & {
  singleVariant: Variant | undefined;
  inlinePresentation: boolean;
}) {
  return {
    brandId: product?.brandId ?? defaultBrandId,
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    badge: product?.badge ?? "",
    accentColor: product?.accentColor ?? NEW_PRODUCT_ACCENT_COLOR,
    imageFileId: product?.imageFileId ?? null,
    sortOrder: product?.sortOrder ?? 0,
    categoryIds: product?.categoryIds ?? [],
    ...(inlinePresentation
      ? {
          presentationName: singleVariant?.name ?? defaultPresentationName,
          price: singleVariant?.price ?? "",
          sku: singleVariant?.sku ?? "",
          isStockTracked: singleVariant?.isStockTracked ?? true,
        }
      : NO_INLINE_PRESENTATION),
  };
}

/**
 * The only presentation to save with the product, when the form filled it in.
 * @param fields The form's presentation fields, parsed.
 * @param singleVariant The presentation being edited, if the product has one.
 * @returns The presentation input, or null when its name or price is missing.
 */
function presentationInput(
  fields: Pick<
    z.output<ProductEditorSchema>,
    "presentationName" | "price" | "sku" | "isStockTracked"
  >,
  singleVariant: Variant | undefined,
) {
  const { presentationName, price, sku, isStockTracked } = fields;
  if (presentationName === undefined || price === undefined) {
    return null;
  }

  return {
    id: singleVariant?.id ?? null,
    name: presentationName,
    price,
    sku,
    isStockTracked,
    sortOrder: singleVariant?.sortOrder ?? 0,
  };
}

/**
 * State for the product editor: the product's fields and, while it has at most one presentation,
 * that presentation's, saved together. A product saved without its presentation is kept, so the
 * retry updates it.
 * @param options The product being edited (null for a new one), its variants, every brand and
 * category, a new product's brand and presentation name, and the save and dirty callbacks.
 * @returns The form and its handlers, the name and slug handlers, the brands and categories to
 * offer, the image upload, and whether the product was saved without its presentation.
 */
export function useProductForm(options: ProductFormOptions) {
  const { product, variants = [], brands, categories, onSaved, onDirtyChange } = options;
  const activeVariants = variants.filter((variant) => ManagerRecords.isActive(variant));
  const inlinePresentation = activeVariants.length <= 1;
  const singleVariant = inlinePresentation ? activeVariants[0] : undefined;
  const [partialProductId, setPartialProductId] = useState<string | null>(null);

  const server = useServerForm({
    schema: productEditorInputSchema(inlinePresentation),
    values: productValues({ ...options, singleVariant, inlinePresentation }),
    action: async ({ presentationName, price, sku, isStockTracked, ...fields }) => {
      const presentation = inlinePresentation
        ? presentationInput({ presentationName, price, sku, isStockTracked }, singleVariant)
        : null;
      const id = product?.id ?? partialProductId;
      const result = await saveProductAction({ ...fields, id, presentation });
      if (!result.ok || !result.value.presentationError) {
        return result;
      }

      setPartialProductId(result.value.product.id);
      return Results.err(result.value.presentationError);
    },
    fieldErrorCodes: Object.values(CatalogFieldError),
    onSuccess: (saved) => onSaved(saved.product),
    onDirtyChange,
  });
  const fields = useProductControls(server.form, product);
  const nameSlug = useNameSlugFields({
    initialSlug: product?.slug ?? "",
    setSlug: (slug) => server.form.setValue("slug", slug, { shouldDirty: true }),
  });

  return {
    ...server,
    ...fields,
    nameSlug,
    inlinePresentation,
    singleVariant,
    partialProductId,
    hasDefaultPresentation: activeVariants.some((variant) => variant.isDefault),
    brandOptions: choosable(brands, product ? [product.brandId] : []),
    categoryOptions: choosable(categories, product?.categoryIds ?? []),
    canSubmit: !server.isSubmitting && !fields.image.isUploading,
  };
}

/**
 * The product form's controls that aren't plain inputs: brand, categories, color, stock tracking
 * and image.
 * @param form The product form.
 * @param product The product being edited, for its current image.
 * @returns Each control's value and change handler, and the image upload.
 */
function useProductControls(form: ProductEditorForm, product: ManagedProduct | null) {
  const { control, setValue } = form;
  const brand = useController({ control, name: "brandId" }).field;
  const categories = useController({ control, name: "categoryIds" }).field;
  const color = useController({ control, name: "accentColor" }).field;
  const stockTracked = useController({ control, name: "isStockTracked" }).field;
  const image = useCatalogImageUpload(
    CatalogImagePurpose.ProductImage,
    { fileId: product?.imageFileId ?? null, previewUrl: product?.imageUrl ?? null },
    (fileId) => setValue("imageFileId", fileId, { shouldDirty: true }),
  );
  const categoryIds = categories.value ?? [];

  const toggleCategory = (categoryId: string, isSelected: boolean) => {
    const others = categoryIds.filter((id) => id !== categoryId);
    categories.onChange(isSelected ? [...others, categoryId] : others);
  };

  return {
    brandId: brand.value,
    selectBrand: (brandId: string) => brand.onChange(brandId),
    categoryIds,
    toggleCategory,
    accentColor: color.value,
    setAccentColor: (value: string) => color.onChange(value),
    isStockTracked: stockTracked.value ?? true,
    setIsStockTracked: (checked: boolean) => stockTracked.onChange(checked),
    image,
  };
}
