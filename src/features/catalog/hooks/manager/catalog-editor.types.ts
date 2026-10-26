import type { CatalogManagerViewValue } from "../../domain/manager";

/**
 * Live editor checks read at navigation time, including controlled form values.
 */
export type CatalogEditorState = {
  hasChanges: () => boolean;
  isBusy: () => boolean;
};

/**
 * The next catalog location after accepting a change of record or section.
 */
export type CatalogNavigationTarget = {
  view: CatalogManagerViewValue;
  editingId: string | null;
};
