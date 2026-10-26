import type { CatalogManagerViewValue } from "../../domain/manager";

/**
 * The next catalog location after accepting a change of record or section.
 */
export type CatalogNavigationTarget = {
  view: CatalogManagerViewValue;
  editingId: string | null;
};
