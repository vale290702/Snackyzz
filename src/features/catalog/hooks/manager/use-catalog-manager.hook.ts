"use client";

import { useState } from "react";

import {
  ALL_BRANDS,
  CatalogManagerView,
  ManagerRecords,
  NEW_RECORD,
  RecordAction,
  RecordStatusFilter,
  type CatalogManagerViewValue,
  type RecordStatusFilterValue,
} from "../../domain/manager";
import { VariantSelection } from "../../domain/variants";
import type { CatalogManagerData, ManagedProduct, Variant } from "../../index";

/**
 * A product as its row shows it: the brand's label (its name when it has none), the default variant's price and how many
 * variants are still sold.
 */
export type ProductRow = {
  product: ManagedProduct;
  brandLabel: string | null;
  defaultPrice: number | null;
  activeVariantCount: number;
};

/**
 * The record being edited: an id, `NEW_RECORD` for a new one, or null when the editor is closed.
 */
type EditingId = string | null;

/**
 * Builds the product rows, keeping the products' order.
 * @param data Everything the manager shows.
 * @param products The products to show.
 * @returns One row per product.
 */
function productRows(data: CatalogManagerData, products: readonly ManagedProduct[]): ProductRow[] {
  const brandLabels = new Map(data.brands.map((brand) => [brand.id, brand.label ?? brand.name]));

  return products.map((product) => {
    const variants = data.variants.filter(
      (variant) => variant.productId === product.id && ManagerRecords.isActive(variant),
    );

    return {
      product,
      brandLabel: brandLabels.get(product.brandId) ?? null,
      defaultPrice: VariantSelection.defaultOf(variants)?.price ?? null,
      activeVariantCount: variants.length,
    };
  });
}

/**
 * The brand a new product starts in: the filtered brand, else the primary one, else the first.
 * @param data Everything the manager shows.
 * @param brandFilter The brand filter's value.
 * @returns The brand's id, or an empty string when there are no brands yet.
 */
function newProductBrandId(data: CatalogManagerData, brandFilter: string): string {
  if (brandFilter !== ALL_BRANDS) {
    return brandFilter;
  }

  const active = data.brands.filter((brand) => ManagerRecords.isActive(brand));

  return (active.find((brand) => brand.isPrimary) ?? active[0])?.id ?? "";
}

/**
 * The records the open section lists after the filters, and whether it has any at all.
 * @param data Everything the manager shows.
 * @param view The open section.
 * @param status The status filter.
 * @param brandFilter The brand filter's value.
 * @returns The product rows, brands and categories to list, how many the section shows, and
 * whether the section has records before filtering.
 */
function visibleRecords(
  data: CatalogManagerData,
  view: CatalogManagerViewValue,
  status: RecordStatusFilterValue,
  brandFilter: string,
) {
  const parentBrand = brandFilter === ALL_BRANDS ? null : brandFilter;
  const products = ManagerRecords.withStatus(
    ManagerRecords.ofParent(data.products, "brandId", parentBrand),
    status,
  );
  const brands = ManagerRecords.withStatus(data.brands, status);
  const categories = ManagerRecords.withStatus(data.categories, status);
  const counts = {
    [CatalogManagerView.Products]: { visible: products.length, total: data.products.length },
    [CatalogManagerView.Brands]: { visible: brands.length, total: data.brands.length },
    [CatalogManagerView.Categories]: { visible: categories.length, total: data.categories.length },
  }[view];

  return {
    productRows: productRows(data, products),
    brands,
    categories,
    visibleCount: counts.visible,
    hasRecords: counts.total > 0,
  };
}

/**
 * The records the editor opens: the one being edited in each section, and a product's variants.
 * @param data Everything the manager shows.
 * @param editingId The record being edited, `NEW_RECORD`, or null.
 * @returns The record found in each section (null elsewhere) and the edited product's variants.
 */
function editorRecords(data: CatalogManagerData, editingId: EditingId) {
  const findEditing = <Record extends { id: string }>(records: readonly Record[]) =>
    records.find((record) => record.id === editingId) ?? null;
  const editingProduct = findEditing(data.products);
  const editingVariants: Variant[] = editingProduct
    ? data.variants.filter((variant) => variant.productId === editingProduct.id)
    : [];

  return {
    editingProduct,
    editingVariants,
    editingBrand: findEditing(data.brands),
    editingCategory: findEditing(data.categories),
  };
}

/**
 * State for the catalog manager: which section is open, the filters, and the record in the editor.
 * @param data Every brand, category, product and variant, archived ones included.
 * @returns The section and filters with their choices and handlers, the visible records and the
 * record actions their buttons run, and the editor state.
 */
export function useCatalogManager(data: CatalogManagerData) {
  const [view, setView] = useState<CatalogManagerViewValue>(CatalogManagerView.Products);
  const [status, setStatus] = useState<RecordStatusFilterValue>(RecordStatusFilter.All);
  const [brandFilter, setBrandFilter] = useState<string>(ALL_BRANDS);
  const [editingId, setEditingId] = useState<EditingId>(null);

  function selectView(next: CatalogManagerViewValue) {
    setView(next);
    setEditingId(null);
  }

  return {
    view,
    viewOptions: Object.values(CatalogManagerView),
    selectView,
    showsProducts: view === CatalogManagerView.Products,
    showsBrands: view === CatalogManagerView.Brands,
    showsCategories: view === CatalogManagerView.Categories,
    status,
    statusOptions: Object.values(RecordStatusFilter),
    selectStatus: setStatus,
    brandFilter,
    brandFilterOptions: [
      { value: ALL_BRANDS, name: null },
      ...data.brands
        .filter((brand) => ManagerRecords.isActive(brand))
        .map((brand) => ({ value: brand.id, name: brand.name })),
    ],
    selectBrandFilter: setBrandFilter,
    ...visibleRecords(data, view, status, brandFilter),
    recordActions: RecordAction,
    allBrands: data.brands,
    allCategories: data.categories,
    newProductBrandId: newProductBrandId(data, brandFilter),
    isEditorOpen: editingId !== null,
    isCreating: editingId === NEW_RECORD,
    editingId,
    ...editorRecords(data, editingId),
    startCreate: () => setEditingId(NEW_RECORD),
    edit: setEditingId,
    closeEditor: () => setEditingId(null),
  };
}
