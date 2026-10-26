import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useVariantForm } from "./use-variant-form.hook";
import { createVariantAction, updateVariantAction } from "../../server/variants/variants.actions";
import { CatalogRecords } from "../../ui/testing/catalog-records.helper";

vi.mock("../../server/variants/variants.actions", () => ({
  createVariantAction: vi.fn(),
  updateVariantAction: vi.fn(),
}));

const variant = CatalogRecords.variant({ isStockTracked: false });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useVariantForm", () => {
  it("adds a variant to the product with the stock choice", async () => {
    vi.mocked(createVariantAction).mockResolvedValue({ ok: true, value: variant });
    const onSaved = vi.fn();
    const { result } = renderHook(() =>
      useVariantForm({ productId: variant.productId, variant: null, onSaved }),
    );

    expect(result.current.isStockTracked).toBe(true);
    act(() => {
      result.current.form.setValue("name", "Caja de 6");
      result.current.form.setValue("price", "13500");
      result.current.setIsStockTracked(false);
    });
    await act(() => result.current.submit());

    expect(createVariantAction).toHaveBeenCalledWith({
      productId: variant.productId,
      name: "Caja de 6",
      price: 13500,
      sku: null,
      isStockTracked: false,
      sortOrder: 0,
    });
    expect(onSaved).toHaveBeenCalledWith(variant);
  });

  it("updates the variant being edited", async () => {
    vi.mocked(updateVariantAction).mockResolvedValue({ ok: true, value: variant });
    const { result } = renderHook(() =>
      useVariantForm({ productId: variant.productId, variant, onSaved: vi.fn() }),
    );

    expect(result.current.isStockTracked).toBe(false);
    act(() => {
      result.current.setIsStockTracked(true);
      result.current.form.setValue("sku", "SNK-1");
    });
    await act(() => result.current.submit());

    expect(result.current.isStockTracked).toBe(true);
    expect(updateVariantAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: variant.id, sku: "SNK-1", isStockTracked: true }),
    );
  });

  it("reports an invalid price without calling the server", async () => {
    const { result } = renderHook(() =>
      useVariantForm({ productId: variant.productId, variant: null, onSaved: vi.fn() }),
    );

    act(() => {
      result.current.form.setValue("name", "Unidad");
      result.current.form.setValue("price", "0");
    });
    await act(() => result.current.submit());

    expect(createVariantAction).not.toHaveBeenCalled();
    expect(result.current.fieldErrors).toEqual({ price: "price_invalid" });
    expect(result.current.form.getValues()).toMatchObject({ name: "Unidad", price: "0" });
  });
});
