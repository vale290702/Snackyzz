"use client";

import { useState } from "react";

import type { Category } from "../../index";

/**
 * Filters optional categories without discarding selected values outside the search.
 * @param options Available category records.
 * @returns Search text, filtered choices and its change handler.
 */
export function useCategoryCheckboxes(options: readonly Category[]) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase();
  const filteredOptions = options.filter((category) =>
    category.name.toLocaleLowerCase().includes(query),
  );
  return { search, setSearch, filteredOptions };
}
