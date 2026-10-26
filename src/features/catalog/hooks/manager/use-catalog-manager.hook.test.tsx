import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EditorForm } from "./catalog-editor.constants";
import { useCatalogManager } from "./use-catalog-manager.hook";
import { CatalogOrderDirection, CatalogOrderKind } from "./use-catalog-ordering.hook";
import {
  ALL_BRANDS,
  CatalogManagerView,
  NEW_RECORD,
  RecordStatusFilter,
} from "../../domain/manager";
import type { CatalogManagerData } from "../../index";
import { updateBrandAction } from "../../server/brands/brands.actions";
import { CatalogRecords } from "../../ui/testing/catalog-records.helper";

vi.mock("../../server/brands/brands.actions", () => ({ updateBrandAction: vi.fn() }));
vi.mock("../../server/categories/categories.actions", () => ({ updateCategoryAction: vi.fn() }));
vi.mock("../../server/products/products.actions", () => ({ updateProductAction: vi.fn() }));
vi.mock("../../server/variants/variants.actions", () => ({ updateVariantAction: vi.fn() }));

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
  it("opens on active products, with each one's brand, default price and active variants", () => {
    const { result } = renderHook(() => useCatalogManager(data));

    expect(result.current.showsProducts).toBe(true);
    expect(result.current.productRows.map((row) => row.product.id)).toEqual([choco.id, chip.id]);
    expect(result.current.status).toBe(RecordStatusFilter.Active);
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

  it("cannot open an editor while a full-record reorder is writing", async () => {
    let finish: (() => void) | undefined;
    vi.mocked(updateBrandAction).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({ ok: true, value: primary });
        }),
    );
    const { result } = renderHook(() => useCatalogManager(data));
    act(() =>
      result.current.ordering.move(CatalogOrderKind.Brands, primary.id, CatalogOrderDirection.Down),
    );
    await waitFor(() => expect(result.current.ordering.isPending).toBe(true));
    act(() => result.current.edit(primary.id));
    expect(result.current.isEditorOpen).toBe(false);
    act(() => result.current.startCreate());
    expect(result.current.isEditorOpen).toBe(false);
    vi.mocked(updateBrandAction).mockResolvedValue({ ok: true, value: primary });
    await act(async () => finish?.());
  });

  it("protects dirty close and record switches until discarded", () => {
    const { result } = renderHook(() => useCatalogManager(data));
    act(() => result.current.edit(choco.id));
    act(() => result.current.reportDirty(EditorForm.Record, true));
    act(() => result.current.closeEditor());
    expect(result.current.isEditorOpen).toBe(true);
    expect(result.current.isDiscardOpen).toBe(true);
    act(() => result.current.cancelDiscard());
    act(() => result.current.edit(chip.id));
    expect(result.current.editingId).toBe(choco.id);
    act(() => result.current.discardChanges());
    expect(result.current.editingId).toBe(chip.id);
  });

  it("closes without asking once the record is saved", () => {
    const { result } = renderHook(() => useCatalogManager(data));
    act(() => result.current.edit(choco.id));
    act(() => result.current.reportDirty(EditorForm.Record, true));
    act(() => result.current.saved());
    expect(result.current.isEditorOpen).toBe(false);
  });
});
