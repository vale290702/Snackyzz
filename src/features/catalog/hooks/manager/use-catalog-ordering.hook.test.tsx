import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Results, SharedError } from "@/shared/lib/result";

import { useCatalogOrdering } from "./use-catalog-ordering.hook";
import { CatalogError } from "../../domain/errors";
import {
  CatalogOrderDirection,
  CatalogOrderKind,
} from "../../domain/manager/catalog-ordering.constants";
import type { CatalogManagerData } from "../../index";
import { CatalogRecords } from "../../ui/testing/catalog-records.helper";

const actions = vi.hoisted(() => ({
  brand: vi.fn(),
  category: vi.fn(),
  product: vi.fn(),
  variant: vi.fn(),
}));
vi.mock("../../server/brands/brands.actions", () => ({ updateBrandAction: actions.brand }));
vi.mock("../../server/categories/categories.actions", () => ({
  updateCategoryAction: actions.category,
}));
vi.mock("../../server/products/products.actions", () => ({ updateProductAction: actions.product }));
vi.mock("../../server/variants/variants.actions", () => ({ updateVariantAction: actions.variant }));

const first = CatalogRecords.product({ categoryIds: ["category-kept"], imageFileId: "image-kept" });
const second = CatalogRecords.product({ id: "second", sortOrder: 1 });
const data: CatalogManagerData = {
  brands: [CatalogRecords.brand(), CatalogRecords.brand({ id: "other-brand", sortOrder: 1 })],
  categories: [
    CatalogRecords.category(),
    CatalogRecords.category({ id: "other-category", sortOrder: 1 }),
  ],
  products: [
    first,
    second,
    CatalogRecords.product({ id: "other-product", brandId: "other-brand" }),
  ],
  variants: [
    CatalogRecords.variant({ sku: "kept", isStockTracked: false }),
    CatalogRecords.variant({ id: "second-variant", sortOrder: 1 }),
    CatalogRecords.variant({ id: "other-product-variant", productId: "other-product" }),
    CatalogRecords.variant({ id: "archived-variant", archivedAt: "2026-10-01T00:00:00Z" }),
  ],
};

describe("useCatalogOrdering", () => {
  beforeEach(() => {
    Object.values(actions).forEach((action) =>
      action.mockReset().mockResolvedValue(Results.ok({})),
    );
  });

  it("preserves complete product fields and moves only within its brand", async () => {
    const { result } = renderHook(() => useCatalogOrdering(data));
    expect(
      result.current.canMove(CatalogOrderKind.Products, first.id, CatalogOrderDirection.Up),
    ).toBe(false);
    await act(async () =>
      result.current.move(CatalogOrderKind.Products, first.id, CatalogOrderDirection.Down),
    );
    expect(actions.product.mock.calls.map(([input]) => input)).toEqual([
      { ...second, sortOrder: 0 },
      { ...first, sortOrder: 1 },
    ]);
    expect(result.current.error).toBeNull();
  });

  it.each([
    [CatalogOrderKind.Brands, data.brands[0]?.id, "brand"],
    [CatalogOrderKind.Categories, data.categories[0]?.id, "category"],
    [CatalogOrderKind.Variants, data.variants[0]?.id, "variant"],
  ] as const)("routes %s to its existing update action", async (kind, id, action) => {
    const { result } = renderHook(() => useCatalogOrdering(data));
    await act(async () => result.current.move(kind, id ?? "", CatalogOrderDirection.Down));
    expect(actions[action]).toHaveBeenCalledTimes(2);
    if (action === "variant") {
      expect(actions.variant).toHaveBeenLastCalledWith({ ...data.variants[0], sortOrder: 1 });
    }
  });

  it("stops on a failed update and exposes its code without concealing earlier writes", async () => {
    actions.product
      .mockResolvedValueOnce(Results.ok(second))
      .mockResolvedValueOnce(Results.err(CatalogError.ProductNotFound));
    const products = [...data.products, CatalogRecords.product({ id: "third", sortOrder: 10 })];
    const { result } = renderHook(() => useCatalogOrdering({ ...data, products }));
    await act(async () =>
      result.current.move(CatalogOrderKind.Products, first.id, CatalogOrderDirection.Down),
    );
    expect(result.current.error).toBe(CatalogError.ProductNotFound);
    expect(actions.product).toHaveBeenCalledTimes(2);
    expect(
      result.current.canMove(CatalogOrderKind.Products, first.id, CatalogOrderDirection.Down),
    ).toBe(true);
  });

  it("ignores missing records and unavailable edges without writing", () => {
    const { result } = renderHook(() => useCatalogOrdering(data));
    act(() => {
      result.current.move(CatalogOrderKind.Products, "missing", CatalogOrderDirection.Down);
      result.current.move(CatalogOrderKind.Products, first.id, CatalogOrderDirection.Up);
      result.current.move(CatalogOrderKind.Variants, "archived-variant", CatalogOrderDirection.Up);
    });
    expect(Object.values(actions).every((action) => action.mock.calls.length === 0)).toBe(true);
    expect(result.current.isPending).toBe(false);
  });

  it("shows a safe failure for rejected transport and permits a later retry", async () => {
    actions.product.mockRejectedValueOnce(new Error("network failed"));
    const { result } = renderHook(() => useCatalogOrdering(data));
    await act(async () =>
      result.current.move(CatalogOrderKind.Products, first.id, CatalogOrderDirection.Down),
    );
    expect(result.current.error).toBe(SharedError.Unexpected);
    expect(result.current.isPending).toBe(false);
    await act(async () =>
      result.current.move(CatalogOrderKind.Products, first.id, CatalogOrderDirection.Down),
    );
    expect(result.current.error).toBeNull();
  });

  it("derives later moves from revalidated server records", async () => {
    const { result, rerender } = renderHook((currentData) => useCatalogOrdering(currentData), {
      initialProps: data,
    });
    await act(async () =>
      result.current.move(CatalogOrderKind.Products, first.id, CatalogOrderDirection.Down),
    );
    rerender({
      ...data,
      products: [
        { ...second, sortOrder: 0 },
        { ...first, sortOrder: 1 },
      ],
    });
    expect(
      result.current.canMove(CatalogOrderKind.Products, first.id, CatalogOrderDirection.Down),
    ).toBe(false);
    expect(
      result.current.canMove(CatalogOrderKind.Products, first.id, CatalogOrderDirection.Up),
    ).toBe(true);
  });

  it("locks every list during pending work, including repeated clicks before rerender", async () => {
    let resolveUpdate: ((value: ReturnType<typeof Results.ok>) => void) | undefined;
    actions.product.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    const { result } = renderHook(() => useCatalogOrdering(data));
    act(() => {
      result.current.move(CatalogOrderKind.Products, first.id, CatalogOrderDirection.Down);
      result.current.move(
        CatalogOrderKind.Categories,
        data.categories[0]?.id ?? "",
        CatalogOrderDirection.Down,
      );
    });
    expect(result.current.isPending).toBe(true);
    expect(
      result.current.canMove(
        CatalogOrderKind.Brands,
        data.brands[0]?.id ?? "",
        CatalogOrderDirection.Down,
      ),
    ).toBe(false);
    expect(actions.category).not.toHaveBeenCalled();
    await act(async () => resolveUpdate?.(Results.ok({})));
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
