"use client";

import { useState } from "react";

import { useCatalogImageUpload } from "./use-catalog-image-upload.hook";
import { useProductSubmission } from "./use-product-submission.hook";
import { CatalogImagePurpose } from "../../domain/images";
import { ManagerRecords, NEW_PRODUCT_ACCENT_COLOR, NEW_RECORD } from "../../domain/manager";
import type { Category, ManagedBrand, ManagedProduct, Product, Variant } from "../../index";

/**
 * Props the product form's hook needs.
 */
type ProductFormOptions = {
  product: ManagedProduct | null;
  variants?: readonly Variant[];
  brands: readonly ManagedBrand[];
  categories: readonly Category[];
  defaultBrandId: string;
  onSaved: (product: Product) => void;
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
 * State for the product editor: brand, categories and image are kept here so a failed save keeps
 * them; text fields are restored by the form.
 * @param options The product being edited (null for a new one), every brand and category, the
 * brand a new one starts in, and what to do once it is saved.
 * @returns The form action and codes, the brands and categories to offer with the chosen ones and
 * their handlers, the color, the image upload, and whether the form can be submitted.
 */
export function useProductForm({
  product,
  variants = [],
  brands,
  categories,
  defaultBrandId,
  onSaved,
}: ProductFormOptions) {
  const activeVariants = variants.filter((variant) => variant.archivedAt === null);
  const inlinePresentation = activeVariants.length <= 1;
  const singleVariant = activeVariants[0];
  const trackingKey = inlinePresentation ? (singleVariant?.id ?? NEW_RECORD) : null;
  const [tracking, setTracking] = useState({
    key: trackingKey,
    value: singleVariant?.isStockTracked ?? true,
  });
  if (tracking.key !== trackingKey) {
    setTracking({ key: trackingKey, value: singleVariant?.isStockTracked ?? true });
  }
  const [brandId, setBrandId] = useState(product?.brandId ?? defaultBrandId);
  const [categoryIds, setCategoryIds] = useState<string[]>(product?.categoryIds ?? []);
  const image = useCatalogImageUpload(CatalogImagePurpose.ProductImage, {
    fileId: product?.imageFileId ?? null,
    previewUrl: product?.imageUrl ?? null,
  });

  const form = useProductSubmission({ product, singleVariant, inlinePresentation, onSaved });

  function toggleCategory(categoryId: string, isSelected: boolean) {
    setCategoryIds((current) => {
      const others = current.filter((id) => id !== categoryId);

      return isSelected ? [...others, categoryId] : others;
    });
  }

  return {
    ...form,
    inlinePresentation,
    hasDefaultPresentation: activeVariants.some((variant) => variant.isDefault),
    singleVariant,
    isStockTracked: tracking.value,
    setIsStockTracked: (value: boolean) => setTracking({ key: trackingKey, value }),
    brandOptions: choosable(brands, product ? [product.brandId] : []),
    categoryOptions: choosable(categories, product?.categoryIds ?? []),
    accentColor: form.values.accentColor ?? product?.accentColor ?? NEW_PRODUCT_ACCENT_COLOR,
    brandId,
    selectBrand: setBrandId,
    categoryIds,
    toggleCategory,
    image,
    canSubmit: !form.isPending && !image.isUploading,
  };
}
