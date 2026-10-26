import { act, renderHook } from "@testing-library/react";
import { startTransition } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useArchiveRecord } from "./use-archive-record.hook";
import { useRecordAction } from "./use-record-action.hook";
import { RecordAction } from "../../domain/manager";
import { archiveBrandAction, setPrimaryBrandAction } from "../../server/brands/brands.actions";
import { archiveVariantAction } from "../../server/variants/variants.actions";
import { CatalogRecords } from "../../ui/testing/catalog-records.helper";

vi.mock("../../server/brands/brands.actions", () => ({
  archiveBrandAction: vi.fn(),
  setPrimaryBrandAction: vi.fn(),
}));
vi.mock("../../server/categories/categories.actions", () => ({ archiveCategoryAction: vi.fn() }));
vi.mock("../../server/products/products.actions", () => ({ archiveProductAction: vi.fn() }));
vi.mock("../../server/variants/variants.actions", () => ({
  archiveVariantAction: vi.fn(),
  setDefaultVariantAction: vi.fn(),
}));

const brand = CatalogRecords.brand();

function recordForm(id: string): FormData {
  const formData = new FormData();
  formData.set("id", id);

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

describe("useRecordAction", () => {
  it("runs the chosen action with the record's id", async () => {
    vi.mocked(setPrimaryBrandAction).mockResolvedValue({ ok: true, value: brand });
    const onDone = vi.fn();
    const { result } = renderHook(() => useRecordAction(RecordAction.SetPrimaryBrand, onDone));

    await submit(result.current.formAction, recordForm(brand.id));

    expect(setPrimaryBrandAction).toHaveBeenCalledWith({ id: brand.id });
    expect(archiveBrandAction).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledOnce();
    expect(result.current.formError).toBeNull();
  });

  it("keeps the refusal's code", async () => {
    vi.mocked(archiveVariantAction).mockResolvedValue({
      ok: false,
      error: "default_variant_required",
    });
    const onDone = vi.fn();
    const { result } = renderHook(() => useRecordAction(RecordAction.ArchiveVariant, onDone));

    await submit(result.current.formAction, recordForm(brand.id));

    expect(result.current.formError).toBe("default_variant_required");
    expect(onDone).not.toHaveBeenCalled();
  });

  it("refuses a malformed id without calling the server", async () => {
    const { result } = renderHook(() => useRecordAction(RecordAction.ArchiveBrand));

    await submit(result.current.formAction, recordForm("not-an-id"));

    expect(archiveBrandAction).not.toHaveBeenCalled();
    expect(result.current.fieldErrors).toEqual({ id: "reference_invalid" });
  });
});

describe("useArchiveRecord", () => {
  it("closes the confirmation once the record is archived", async () => {
    vi.mocked(archiveBrandAction).mockResolvedValue({ ok: true, value: brand });
    const { result } = renderHook(() => useArchiveRecord(RecordAction.ArchiveBrand));

    act(() => result.current.setIsOpen(true));
    await submit(result.current.formAction, recordForm(brand.id));

    expect(archiveBrandAction).toHaveBeenCalledWith({ id: brand.id });
    expect(result.current.isOpen).toBe(false);
  });

  it("stays open with the code when archiving is refused", async () => {
    vi.mocked(archiveBrandAction).mockResolvedValue({ ok: false, error: "primary_brand_required" });
    const { result } = renderHook(() => useArchiveRecord(RecordAction.ArchiveBrand));

    act(() => result.current.setIsOpen(true));
    await submit(result.current.formAction, recordForm(brand.id));

    expect(result.current).toMatchObject({ isOpen: true, formError: "primary_brand_required" });
  });
});
