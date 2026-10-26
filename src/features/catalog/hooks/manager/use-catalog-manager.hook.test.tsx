import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useCatalogManager } from "./use-catalog-manager.hook";
import {
  ALL_BRANDS,
  CatalogManagerView,
  NEW_RECORD,
  RecordStatusFilter,
} from "../../domain/manager";
import type { CatalogManagerData } from "../../index";
import { CatalogRecords } from "../../ui/testing/catalog-records.helper";

const ARCHIVED_AT = "2026-10-01T00:00:00Z";

const primary = CatalogRecords.brand();
const collab = CatalogRecords.brand({
  id: "brand-collab",
  name: "Baking Stereo",
  isPrimary: false,
});
const archivedBrand = CatalogRecords.brand({
  id: "brand-old",
  name: "Antigua",
  isPrimary: false,
  archivedAt: ARCHIVED_AT,
});
const choco = CatalogRecords.product();
const chip = CatalogRecords.product({ id: "product-chip", brandId: collab.id, name: "Chip" });
const retired = CatalogRecords.product({
  id: "product-retired",
  name: "Retirada",
  archivedAt: ARCHIVED_AT,
});
const unit = CatalogRecords.variant({ isDefault: false, price: 2500 });
const box = CatalogRecords.variant({ id: "variant-box", isDefault: true, price: 13500 });
const gone = CatalogRecords.variant({ id: "variant-gone", archivedAt: ARCHIVED_AT });

const data: CatalogManagerData = {
  brands: [primary, collab, archivedBrand],
  categories: [CatalogRecords.category()],
  products: [choco, chip, retired],
  variants: [unit, box, gone],
};

describe("useCatalogManager", () => {
  it("opens on every product, with each one's brand, default price and active variants", () => {
    const { result } = renderHook(() => useCatalogManager(data));

    expect(result.current.showsProducts).toBe(true);
    expect(result.current.productRows.map((row) => row.product.id)).toEqual([
      choco.id,
      chip.id,
      retired.id,
    ]);
    expect(result.current.productRows[0]).toMatchObject({
      brandLabel: primary.name,
      defaultPrice: box.price,
      activeVariantCount: 2,
    });
    expect(result.current.productRows[1]).toMatchObject({
      brandLabel: collab.name,
      defaultPrice: null,
      activeVariantCount: 0,
    });
  });

  it("filters products by brand and status, and starts new ones in the filtered brand", () => {
    const { result } = renderHook(() => useCatalogManager(data));

    act(() => result.current.selectBrandFilter(primary.id));
    act(() => result.current.selectStatus(RecordStatusFilter.Archived));

    expect(result.current.productRows.map((row) => row.product.id)).toEqual([retired.id]);

    act(() => result.current.selectBrandFilter(collab.id));
    expect(result.current.newProductBrandId).toBe(collab.id);
  });

  it("offers only active brands as filters, after the all-brands choice", () => {
    const { result } = renderHook(() => useCatalogManager(data));

    expect(result.current.brandFilterOptions).toEqual([
      { value: ALL_BRANDS, name: null },
      { value: primary.id, name: primary.name },
      { value: collab.id, name: collab.name },
    ]);
  });

  it("tells an empty section from a filter that matches nothing", () => {
    const { result } = renderHook(() =>
      useCatalogManager({ ...data, categories: [], brands: [primary] }),
    );

    act(() => result.current.selectView(CatalogManagerView.Categories));
    expect(result.current).toMatchObject({ showsCategories: true, hasRecords: false });

    act(() => result.current.selectView(CatalogManagerView.Brands));
    act(() => result.current.selectStatus(RecordStatusFilter.Archived));
    expect(result.current).toMatchObject({ hasRecords: true, visibleCount: 0 });
  });

  it("opens a product with all its variants, and closes the editor when the section changes", () => {
    const { result } = renderHook(() => useCatalogManager(data));

    act(() => result.current.edit(choco.id));
    expect(result.current).toMatchObject({
      isEditorOpen: true,
      isCreating: false,
      editingProduct: choco,
      editingVariants: [unit, box, gone],
    });

    act(() => result.current.selectView(CatalogManagerView.Brands));
    expect(result.current.isEditorOpen).toBe(false);
  });

  it("starts a new record in the primary brand", () => {
    const { result } = renderHook(() => useCatalogManager(data));

    act(() => result.current.startCreate());

    expect(result.current).toMatchObject({
      editingId: NEW_RECORD,
      isCreating: true,
      editingProduct: null,
      newProductBrandId: primary.id,
    });
  });
});
