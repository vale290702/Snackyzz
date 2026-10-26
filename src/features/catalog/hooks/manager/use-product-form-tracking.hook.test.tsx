import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useProductForm } from "./use-product-form.hook";
import { CatalogRecords } from "../../ui/testing/catalog-records.helper";

vi.mock("../../server/products/products.actions", () => ({
  createProductAction: vi.fn(),
  updateProductAction: vi.fn(),
}));
vi.mock("../../server/variants/variants.actions", () => ({
  createVariantAction: vi.fn(),
  updateVariantAction: vi.fn(),
}));
vi.mock("../../server/images/images.actions", () => ({
  createCatalogImageUploadAction: vi.fn(),
  registerCatalogImageUploadAction: vi.fn(),
}));
const primary = CatalogRecords.brand();
const product = CatalogRecords.product();
const brands = [primary];
const categories = [CatalogRecords.category()];

describe("product presentation tracking", () => {
  it("uses the surviving presentation tracking flag after two presentations become one", () => {
    const removed = CatalogRecords.variant({
      id: "removed",
      isDefault: false,
      isStockTracked: true,
    });
    const survivor = CatalogRecords.variant({
      id: "survivor",
      isDefault: true,
      isStockTracked: false,
    });
    const { result, rerender } = renderHook(
      ({ variants }) =>
        useProductForm({
          product,
          variants,
          brands,
          categories,
          defaultBrandId: primary.id,
          onSaved: vi.fn(),
        }),
      { initialProps: { variants: [removed, survivor] } },
    );
    rerender({ variants: [survivor] });
    expect(result.current.isStockTracked).toBe(false);
    act(() => result.current.setIsStockTracked(true));
    rerender({ variants: [survivor] });
    expect(result.current.isStockTracked).toBe(true);
  });

  it("forgets an inline tracking choice across a single to multiple to single roundtrip", () => {
    const first = CatalogRecords.variant({ id: "first", isStockTracked: true });
    const second = CatalogRecords.variant({ id: "second", isDefault: false });
    const { result, rerender } = renderHook(
      ({ variants }) =>
        useProductForm({
          product,
          variants,
          brands,
          categories,
          defaultBrandId: primary.id,
          onSaved: vi.fn(),
        }),
      { initialProps: { variants: [first] } },
    );
    expect(result.current.isStockTracked).toBe(true);
    rerender({ variants: [first, second] });
    const updated = { ...first, isStockTracked: false };
    rerender({ variants: [updated, second] });
    rerender({ variants: [updated] });
    expect(result.current.isStockTracked).toBe(false);
  });
});
