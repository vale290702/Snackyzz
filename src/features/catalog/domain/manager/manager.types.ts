import type { CatalogManagerView, RecordAction, RecordStatusFilter } from "./manager.constants";

/**
 * A list catalog management shows.
 */
export type CatalogManagerViewValue = (typeof CatalogManagerView)[keyof typeof CatalogManagerView];

/**
 * Which records a list shows by whether they are archived.
 */
export type RecordStatusFilterValue = (typeof RecordStatusFilter)[keyof typeof RecordStatusFilter];

/**
 * A record that can be archived.
 */
export type ArchivableRecord = {
  archivedAt: string | null;
};

/**
 * A one-click record change.
 */
export type RecordActionValue = (typeof RecordAction)[keyof typeof RecordAction];
