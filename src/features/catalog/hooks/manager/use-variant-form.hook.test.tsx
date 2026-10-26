import { act, renderHook } from "@testing-library/react";
import { startTransition } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useVariantForm } from "./use-variant-form.hook";
import { createVariantAction, updateVariantAction } from "../../server/variants/variants.actions";
import { CatalogRecords } from "../../ui/testing/catalog-records.helper";

vi.mock("../../server/variants/variants.actions", () => ({
  createVariantAction: vi.fn(),
  updateVariantAction: vi.fn(),
}));

const variant = CatalogRecords.variant({ isStockTracked: false });

function variantForm(fields: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [name, value] of Object.entries(fields)) {
    formData.set(name, value);
  }

  return formData;
}

async function submit(formAction: (formData: FormData) => void, formData: FormData) {
  await act(async () => {
    startTransition(() => formAction(formData));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useVariantForm", () => {
  it("adds a variant to the product, reading the unchecked stock box as false", async () => {
    vi.mocked(createVariantAction).mockResolvedValue({ ok: true, value: variant });
    const onSaved = vi.fn();
    const { result } = renderHook(() =>
      useVariantForm({ productId: variant.productId, variant: null, onSaved }),
    );

    expect(result.current.isStockTracked).toBe(true);
    await submit(result.current.formAction, variantForm({ name: "Caja de 6", price: "13500" }));

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

  it("updates the variant being edited, reading the checked stock box as true", async () => {
    vi.mocked(updateVariantAction).mockResolvedValue({ ok: true, value: variant });
    const { result } = renderHook(() =>
      useVariantForm({ productId: variant.productId, variant, onSaved: vi.fn() }),
    );

    expect(result.current.isStockTracked).toBe(false);
    act(() => result.current.setIsStockTracked(true));
    await submit(
      result.current.formAction,
      variantForm({ name: "Unidad", price: "2500", sku: "SNK-1", isStockTracked: "on" }),
    );

    expect(result.current.isStockTracked).toBe(true);
    expect(updateVariantAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: variant.id, sku: "SNK-1", isStockTracked: true }),
    );
  });

  it("reports an invalid price without calling the server", async () => {
    const { result } = renderHook(() =>
      useVariantForm({ productId: variant.productId, variant: null, onSaved: vi.fn() }),
    );

    await submit(result.current.formAction, variantForm({ name: "Unidad", price: "0" }));

    expect(createVariantAction).not.toHaveBeenCalled();
    expect(result.current.fieldErrors).toEqual({ price: "price_invalid" });
    expect(result.current.values).toMatchObject({ name: "Unidad", price: "0" });
  });
});
