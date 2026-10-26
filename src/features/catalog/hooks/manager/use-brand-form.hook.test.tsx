import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBrandForm } from "./use-brand-form.hook";
import { createBrandAction, updateBrandAction } from "../../server/brands/brands.actions";
import { CatalogRecords } from "../../ui/testing/catalog-records.helper";

vi.mock("../../server/brands/brands.actions", () => ({
  createBrandAction: vi.fn(),
  updateBrandAction: vi.fn(),
}));
vi.mock("../../server/images/images.actions", () => ({
  createCatalogImageUploadAction: vi.fn(),
  registerCatalogImageUploadAction: vi.fn(),
}));

const LOGO_ID = "00000000-0000-7000-8000-0000000000f2";

const brand = CatalogRecords.brand({
  logoFileId: LOGO_ID,
  logoUrl: "https://storage.test/logo.png",
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useBrandForm", () => {
  it("starts from the brand's logo", () => {
    const { result } = renderHook(() => useBrandForm({ brand, onSaved: vi.fn() }));

    expect(result.current.logo).toMatchObject({
      fileId: LOGO_ID,
      previewUrl: "https://storage.test/logo.png",
    });
    expect(result.current.canSubmit).toBe(true);
  });

  it("creates a brand with blank optional copy stored as null", async () => {
    vi.mocked(createBrandAction).mockResolvedValue({ ok: true, value: brand });
    const onSaved = vi.fn();
    const { result } = renderHook(() => useBrandForm({ brand: null, onSaved }));

    act(() => {
      result.current.form.setValue("name", "Baking Stereo");
      result.current.form.setValue("slug", "baking-stereo");
      result.current.form.setValue("tagline", " ");
    });
    await act(() => result.current.submit());

    expect(createBrandAction).toHaveBeenCalledWith({
      name: "Baking Stereo",
      slug: "baking-stereo",
      tagline: null,
      description: null,
      label: null,
      logoFileId: null,
      sortOrder: 0,
    });
    expect(onSaved).toHaveBeenCalledWith(brand);
  });

  it("updates the brand being edited, keeping its logo", async () => {
    vi.mocked(updateBrandAction).mockResolvedValue({ ok: true, value: brand });
    const { result } = renderHook(() => useBrandForm({ brand, onSaved: vi.fn() }));

    await act(() => result.current.submit());

    expect(updateBrandAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: brand.id, logoFileId: LOGO_ID }),
    );
  });

  it("keeps the server's code and the typed text when the slug is taken", async () => {
    vi.mocked(createBrandAction).mockResolvedValue({ ok: false, error: "slug_taken" });
    const onSaved = vi.fn();
    const { result } = renderHook(() => useBrandForm({ brand: null, onSaved }));

    act(() => {
      result.current.form.setValue("name", "Snackyzz");
      result.current.form.setValue("slug", "snackyzz");
      result.current.form.setValue("tagline", "Nuevo");
    });
    await act(() => result.current.submit());

    expect(result.current.formError).toBe("slug_taken");
    expect(result.current.form.getValues()).toMatchObject({ slug: "snackyzz", tagline: "Nuevo" });
    expect(onSaved).not.toHaveBeenCalled();
  });
});
