import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useCategoryForm", () => {
  it("creates a category from parsed input and reports it saved", async () => {
    vi.mocked(createCategoryAction).mockResolvedValue({ ok: true, value: category });
    const onSaved = vi.fn();
    const { result } = renderHook(() => useCategoryForm({ category: null, onSaved }));

    act(() => {
      result.current.form.setValue("name", " Clásicas ");
      result.current.form.setValue("slug", "clasicas");
    });
    await act(() => result.current.submit());

    expect(createCategoryAction).toHaveBeenCalledWith({
      name: "Clásicas",
      slug: "clasicas",
      sortOrder: 0,
    });
    expect(onSaved).toHaveBeenCalledWith(category);
  });

  it("updates the category being edited, keeping its position", async () => {
    vi.mocked(updateCategoryAction).mockResolvedValue({ ok: true, value: category });
    const editing = CatalogRecords.category({ sortOrder: 3 });
    const { result } = renderHook(() => useCategoryForm({ category: editing, onSaved: vi.fn() }));

    act(() => result.current.form.setValue("name", "Nuevas"));
    await act(() => result.current.submit());

    expect(updateCategoryAction).toHaveBeenCalledWith({
      id: editing.id,
      name: "Nuevas",
      slug: editing.slug,
      sortOrder: 3,
    });
    expect(createCategoryAction).not.toHaveBeenCalled();
  });

  it("reports field codes and keeps the typed text without calling the server", async () => {
    const onSaved = vi.fn();
    const { result } = renderHook(() => useCategoryForm({ category: null, onSaved }));

    act(() => {
      result.current.form.setValue("name", "Clásicas");
      result.current.form.setValue("slug", "Clásicas");
    });
    await act(() => result.current.submit());

    expect(createCategoryAction).not.toHaveBeenCalled();
    expect(result.current.fieldErrors).toEqual({ slug: "slug_invalid" });
    expect(result.current.form.getValues()).toMatchObject({ name: "Clásicas", slug: "Clásicas" });
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("keeps the server's code when the slug is taken", async () => {
    vi.mocked(createCategoryAction).mockResolvedValue({ ok: false, error: "slug_taken" });
    const { result } = renderHook(() => useCategoryForm({ category: null, onSaved: vi.fn() }));

    act(() => {
      result.current.form.setValue("name", "Clásicas");
      result.current.form.setValue("slug", "clasicas");
    });
    await act(() => result.current.submit());

    expect(result.current.formError).toBe("slug_taken");
  });

  it("generates a new category's slug from its name", () => {
    const { result } = renderHook(() => useCategoryForm({ category: null, onSaved: vi.fn() }));

    act(() =>
      result.current.nameSlug.nameChanged({
        target: { value: "Edición limitada" },
      } as ChangeEvent<HTMLInputElement>),
    );

    expect(result.current.form.getValues("slug")).toBe("edicion-limitada");
  });
});
