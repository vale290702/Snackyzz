import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProductForm } from "./use-product-form.hook";
import { NEW_PRODUCT_ACCENT_COLOR } from "../../domain/manager";
import type { ManagedProduct, Variant } from "../../index";
import { saveProductAction } from "../../server/products/products.actions";
import { CatalogRecords } from "../../ui/testing/catalog-records.helper";

vi.mock("../../server/products/products.actions", () => ({ saveProductAction: vi.fn() }));
vi.mock("../../server/images/images.actions", () => ({
  createCatalogImageUploadAction: vi.fn(),
  registerCatalogImageUploadAction: vi.fn(),
}));

const ARCHIVED_AT = "2026-10-01T00:00:00Z";
const IMAGE_ID = "00000000-0000-7000-8000-0000000000f1";

const primary = CatalogRecords.brand();
const retiredBrand = CatalogRecords.brand({
  id: "00000000-0000-7000-8000-0000000000b9",
  isPrimary: false,
  archivedAt: ARCHIVED_AT,
});
const classics = CatalogRecords.category();
const seasonal = CatalogRecords.category({ id: "00000000-0000-7000-8000-0000000000c2" });
const retiredCategory = CatalogRecords.category({
  id: "00000000-0000-7000-8000-0000000000c9",
  archivedAt: ARCHIVED_AT,
});
const brands = [primary, retiredBrand];
const categories = [classics, seasonal, retiredCategory];
const product = CatalogRecords.product({
  brandId: retiredBrand.id,
  categoryIds: [retiredCategory.id],
  imageFileId: IMAGE_ID,
  imageUrl: "https://storage.test/choco.webp",
  accentColor: "#5C3A21",
});
const saved = CatalogRecords.product();

type Editing = { product: ManagedProduct | null; variants: Variant[] };

function renderProductForm(initial: Editing, onSaved = vi.fn()) {
  return renderHook(
    ({ product: editing, variants }: Editing) =>
      useProductForm({
        product: editing,
        variants,
        brands,
        categories,
        defaultBrandId: primary.id,
        defaultPresentationName: "Unidad",
        onSaved,
      }),
    { initialProps: initial },
  );
}

function fillNewProduct(result: ReturnType<typeof renderProductForm>["result"]) {
  act(() => {
    result.current.form.setValue("name", "Galleta");
    result.current.form.setValue("slug", "galleta");
    result.current.form.setValue("description", "Chocolate");
    result.current.form.setValue("price", "1500");
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(saveProductAction).mockResolvedValue({
    ok: true,
    value: { product: saved, presentationError: null },
  });
});

describe("useProductForm", () => {
  it("saves a new product with its first presentation and categories in one call", async () => {
    const onSaved = vi.fn();
    const { result } = renderProductForm({ product: null, variants: [] }, onSaved);

    fillNewProduct(result);
    act(() => result.current.toggleCategory(classics.id, true));
    await act(() => result.current.submit());

    expect(saveProductAction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: null,
        brandId: primary.id,
        categoryIds: [classics.id],
        imageFileId: null,
        badge: null,
        presentation: {
          id: null,
          name: "Unidad",
          price: 1500,
          sku: null,
          isStockTracked: true,
          sortOrder: 0,
        },
      }),
    );
    expect(onSaved).toHaveBeenCalledWith(saved);
  });

  it("keeps a product saved without its presentation and retries by updating it", async () => {
    vi.mocked(saveProductAction).mockResolvedValueOnce({
      ok: true,
      value: { product: saved, presentationError: "sku_taken" },
    });
    const onSaved = vi.fn();
    const { result } = renderProductForm({ product: null, variants: [] }, onSaved);

    fillNewProduct(result);
    await act(() => result.current.submit());

    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ partialProductId: saved.id, formError: "sku_taken" });

    await act(() => result.current.submit());

    expect(saveProductAction).toHaveBeenLastCalledWith(expect.objectContaining({ id: saved.id }));
    expect(onSaved).toHaveBeenCalledWith(saved);
  });

  it("updates the sole presentation inline", async () => {
    const variant = CatalogRecords.variant({ productId: product.id, sortOrder: 2 });
    const { result } = renderProductForm({ product, variants: [variant] });

    await act(() => result.current.submit());

    expect(saveProductAction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: product.id,
        presentation: expect.objectContaining({ id: variant.id, sortOrder: 2 }),
      }),
    );
  });

  it("requires a valid initial price before saving anything", async () => {
    const { result } = renderProductForm({ product: null, variants: [] });

    fillNewProduct(result);
    act(() => result.current.form.setValue("price", "0"));
    await act(() => result.current.submit());

    expect(result.current.fieldErrors.price).toBe("price_invalid");
    expect(saveProductAction).not.toHaveBeenCalled();
  });

  it("saves only the product once it has several presentations", async () => {
    const first = CatalogRecords.variant({ productId: product.id });
    const second = CatalogRecords.variant({
      id: "00000000-0000-7000-8000-0000000000e2",
      productId: product.id,
      isDefault: false,
    });
    const { result, rerender } = renderProductForm({ product, variants: [first] });

    expect(result.current.inlinePresentation).toBe(true);
    rerender({ product, variants: [first, second] });
    expect(result.current.inlinePresentation).toBe(false);
    await act(() => result.current.submit());

    expect(saveProductAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: product.id, presentation: null }),
    );
  });

  it("shows refreshed records, keeping fields the owner is changing", async () => {
    const variant = CatalogRecords.variant({ productId: product.id, price: 4000 });
    const { result, rerender } = renderProductForm({ product, variants: [variant] });

    act(() => result.current.form.setValue("badge", "Nuevo", { shouldDirty: true }));
    rerender({
      product: { ...product, name: "Renamed" },
      variants: [{ ...variant, price: 4100, isStockTracked: false }],
    });

    await waitFor(() => expect(result.current.form.getValues("price")).toBe(4100));
    expect(result.current.form.getValues()).toMatchObject({ name: "Renamed", badge: "Nuevo" });
    expect(result.current.isStockTracked).toBe(false);
  });

  it("starts a new product in the default brand with the brand color and no image", () => {
    const { result } = renderProductForm({ product: null, variants: [] });

    expect(result.current).toMatchObject({
      brandId: primary.id,
      categoryIds: [],
      accentColor: NEW_PRODUCT_ACCENT_COLOR,
      isStockTracked: true,
      image: { fileId: null, previewUrl: null },
      canSubmit: true,
    });
    expect(result.current.form.getValues("presentationName")).toBe("Unidad");
    expect(result.current.brandOptions).toEqual([primary]);
    expect(result.current.categoryOptions).toEqual([classics, seasonal]);
  });

  it("keeps an edited product's archived brand and category on offer", () => {
    const { result } = renderProductForm({ product, variants: [] });

    expect(result.current).toMatchObject({
      brandId: retiredBrand.id,
      categoryIds: [retiredCategory.id],
      accentColor: "#5C3A21",
      image: { fileId: IMAGE_ID },
    });
    expect(result.current.brandOptions).toEqual(brands);
    expect(result.current.categoryOptions).toEqual(categories);
  });

  it("toggles categories without duplicates", () => {
    const { result } = renderProductForm({ product: null, variants: [] });

    act(() => result.current.toggleCategory(classics.id, true));
    act(() => result.current.toggleCategory(seasonal.id, true));
    act(() => result.current.toggleCategory(classics.id, true));
    act(() => result.current.toggleCategory(seasonal.id, false));

    expect(result.current.categoryIds).toEqual([classics.id]);
  });

  it("keeps the typed text and color when a field is invalid", async () => {
    const { result } = renderProductForm({ product: null, variants: [] });

    act(() => {
      result.current.form.setValue("slug", "choco");
      result.current.setAccentColor("#123456");
    });
    await act(() => result.current.submit());

    expect(saveProductAction).not.toHaveBeenCalled();
    expect(result.current.fieldErrors).toMatchObject({
      name: "field_required",
      description: "field_required",
    });
    expect(result.current.form.getValues("slug")).toBe("choco");
    expect(result.current.accentColor).toBe("#123456");
  });
});
