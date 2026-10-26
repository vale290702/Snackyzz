import type { EditorForm } from "./catalog-editor.constants";
import type { CatalogManagerViewValue } from "../../domain/manager";

/**
 * The next catalog location after accepting a change of record or section.
 */
export type CatalogNavigationTarget = {
  view: CatalogManagerViewValue;
  editingId: string | null;
};

/**
 * One of the editor's forms that can hold unsaved changes.
 */
export type EditorFormValue = (typeof EditorForm)[keyof typeof EditorForm];
