import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useCategoryCheckboxes } from "./use-category-checkboxes.hook";
import { CatalogRecords } from "../../ui/testing/catalog-records.helper";

describe("useCategoryCheckboxes", () => {
  it("filters optional choices by a case-insensitive trimmed query", () => {
    const classics = CatalogRecords.category({ name: "Clásicas" });
    const seasonal = CatalogRecords.category({
      id: "00000000-0000-7000-8000-0000000000c2",
      name: "Temporada",
    });
    const { result } = renderHook(() => useCategoryCheckboxes([classics, seasonal]));
    act(() => result.current.setSearch("  TEMPORADA "));
    expect(result.current.filteredOptions).toEqual([seasonal]);
    act(() => result.current.setSearch(""));
    expect(result.current.filteredOptions).toEqual([classics, seasonal]);
  });
});
