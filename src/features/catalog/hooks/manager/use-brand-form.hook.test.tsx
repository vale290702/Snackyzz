import { act, renderHook } from "@testing-library/react";
import { startTransition } from "react";
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

function brandForm(fields: Record<string, string>): FormData {
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

    await submit(
      result.current.formAction,
      brandForm({ name: "Baking Stereo", slug: "baking-stereo", tagline: " ", label: "" }),
    );

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

    await submit(
      result.current.formAction,
      brandForm({ name: "Snackyzz", slug: "snackyzz", logoFileId: LOGO_ID }),
    );

    expect(updateBrandAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: brand.id, logoFileId: LOGO_ID }),
    );
  });

  it("keeps the server's code and the typed text when the slug is taken", async () => {
    vi.mocked(createBrandAction).mockResolvedValue({ ok: false, error: "slug_taken" });
    const onSaved = vi.fn();
    const { result } = renderHook(() => useBrandForm({ brand: null, onSaved }));

    await submit(
      result.current.formAction,
      brandForm({ name: "Snackyzz", slug: "snackyzz", tagline: "Nuevo" }),
    );

    expect(result.current.formError).toBe("slug_taken");
    expect(result.current.values).toMatchObject({ slug: "snackyzz", tagline: "Nuevo" });
    expect(onSaved).not.toHaveBeenCalled();
  });
});
