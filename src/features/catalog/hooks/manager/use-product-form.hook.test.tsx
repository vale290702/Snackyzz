import { act, renderHook } from "@testing-library/react";
import { startTransition } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useProductForm } from "./use-product-form.hook";
import { NEW_PRODUCT_ACCENT_COLOR } from "../../domain/manager";
import { createProductAction, updateProductAction } from "../../server/products/products.actions";
import { CatalogRecords } from "../../ui/testing/catalog-records.helper";

vi.mock("../../server/products/products.actions", () => ({
  createProductAction: vi.fn(),
  updateProductAction: vi.fn(),
}));
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

function productForm(fields: Record<string, string | string[]>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    for (const entry of [value].flat()) {
      formData.append(name, entry);
    }
  }

  return formData;
}

async function submit(formAction: (formData: FormData) => void, formData: FormData) {
  await act(async () => {
    startTransition(() => formAction(formData));
  });
}

function renderNewProduct(onSaved = vi.fn()) {
  return renderHook(() =>
    useProductForm({ product: null, brands, categories, defaultBrandId: primary.id, onSaved }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useProductForm", () => {
  it("starts a new product in the default brand with the brand color and no image", () => {
    const { result } = renderNewProduct();

    expect(result.current).toMatchObject({
      brandId: primary.id,
      categoryIds: [],
      accentColor: NEW_PRODUCT_ACCENT_COLOR,
      image: { fileId: null, previewUrl: null },
      canSubmit: true,
    });
    expect(result.current.brandOptions).toEqual([primary]);
    expect(result.current.categoryOptions).toEqual([classics, seasonal]);
  });

  it("keeps an edited product's archived brand and category on offer", () => {
    const { result } = renderHook(() =>
      useProductForm({ product, brands, categories, defaultBrandId: primary.id, onSaved: vi.fn() }),
    );

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
    const { result } = renderNewProduct();

    act(() => result.current.toggleCategory(classics.id, true));
    act(() => result.current.toggleCategory(seasonal.id, true));
    act(() => result.current.toggleCategory(classics.id, true));
    act(() => result.current.toggleCategory(seasonal.id, false));

    expect(result.current.categoryIds).toEqual([classics.id]);
  });

  it("creates a product with every checked category and reports it saved", async () => {
    const saved = CatalogRecords.product();
    vi.mocked(createProductAction).mockResolvedValue({ ok: true, value: saved });
    const onSaved = vi.fn();
    const { result } = renderNewProduct(onSaved);

    await submit(
      result.current.formAction,
      productForm({
        brandId: primary.id,
        name: "Choco Cloud",
        slug: "choco-cloud",
        description: "Suave por dentro.",
        accentColor: "#ED781A",
        categoryIds: [classics.id, seasonal.id],
      }),
    );

    expect(createProductAction).toHaveBeenCalledWith(
      expect.objectContaining({
        brandId: primary.id,
        categoryIds: [classics.id, seasonal.id],
        imageFileId: null,
        badge: null,
      }),
    );
    expect(onSaved).toHaveBeenCalledWith(saved);
  });

  it("updates the product being edited with its image", async () => {
    vi.mocked(updateProductAction).mockResolvedValue({ ok: true, value: product });
    const { result } = renderHook(() =>
      useProductForm({ product, brands, categories, defaultBrandId: primary.id, onSaved: vi.fn() }),
    );

    await submit(
      result.current.formAction,
      productForm({
        brandId: primary.id,
        name: "Choco Cloud",
        slug: "choco-cloud",
        description: "Suave por dentro.",
        accentColor: "#ED781A",
        imageFileId: IMAGE_ID,
      }),
    );

    expect(updateProductAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: product.id, imageFileId: IMAGE_ID, categoryIds: [] }),
    );
  });

  it("keeps the typed text and color when a field is invalid", async () => {
    const { result } = renderNewProduct();

    await submit(
      result.current.formAction,
      productForm({ brandId: primary.id, name: "", slug: "choco", accentColor: "#123456" }),
    );

    expect(createProductAction).not.toHaveBeenCalled();
    expect(result.current.fieldErrors).toMatchObject({
      name: "field_required",
      description: "field_required",
    });
    expect(result.current).toMatchObject({ values: { slug: "choco" }, accentColor: "#123456" });
  });
});
