import { act, renderHook } from "@testing-library/react";
import { startTransition } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCategoryForm } from "./use-category-form.hook";
import {
  createCategoryAction,
  updateCategoryAction,
} from "../../server/categories/categories.actions";
import { CatalogRecords } from "../../ui/testing/catalog-records.helper";

vi.mock("../../server/categories/categories.actions", () => ({
  createCategoryAction: vi.fn(),
  updateCategoryAction: vi.fn(),
}));

const category = CatalogRecords.category();

function categoryForm(fields: Record<string, string>): FormData {
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

describe("useCategoryForm", () => {
  it("creates a category from parsed input and reports it saved", async () => {
    vi.mocked(createCategoryAction).mockResolvedValue({ ok: true, value: category });
    const onSaved = vi.fn();
    const { result } = renderHook(() => useCategoryForm({ category: null, onSaved }));

    await submit(
      result.current.formAction,
      categoryForm({ name: " Clásicas ", slug: "clasicas", sortOrder: "2" }),
    );

    expect(createCategoryAction).toHaveBeenCalledWith({
      name: "Clásicas",
      slug: "clasicas",
      sortOrder: 2,
    });
    expect(onSaved).toHaveBeenCalledWith(category);
  });

  it("updates the category being edited", async () => {
    vi.mocked(updateCategoryAction).mockResolvedValue({ ok: true, value: category });
    const { result } = renderHook(() => useCategoryForm({ category, onSaved: vi.fn() }));

    await submit(result.current.formAction, categoryForm({ name: "Nuevas", slug: "nuevas" }));

    expect(updateCategoryAction).toHaveBeenCalledWith({
      id: category.id,
      name: "Nuevas",
      slug: "nuevas",
      sortOrder: 0,
    });
    expect(createCategoryAction).not.toHaveBeenCalled();
  });

  it("reports field codes and keeps the typed text without calling the server", async () => {
    const onSaved = vi.fn();
    const { result } = renderHook(() => useCategoryForm({ category: null, onSaved }));

    await submit(result.current.formAction, categoryForm({ name: "Clásicas", slug: "Clásicas" }));

    expect(createCategoryAction).not.toHaveBeenCalled();
    expect(result.current.fieldErrors).toEqual({ slug: "slug_invalid" });
    expect(result.current.values).toMatchObject({ name: "Clásicas", slug: "Clásicas" });
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("keeps the server's code when the slug is taken", async () => {
    vi.mocked(createCategoryAction).mockResolvedValue({ ok: false, error: "slug_taken" });
    const { result } = renderHook(() => useCategoryForm({ category: null, onSaved: vi.fn() }));

    await submit(result.current.formAction, categoryForm({ name: "Clásicas", slug: "clasicas" }));

    expect(result.current.formError).toBe("slug_taken");
  });
});
