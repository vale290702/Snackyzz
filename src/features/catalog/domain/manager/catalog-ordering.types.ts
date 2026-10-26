import type { CatalogOrderDirection, CatalogOrderKind } from "./catalog-ordering.constants";
import type { ArchivableRecord } from "./manager.types";

/**
 * An orderable catalog list.
 */
export type CatalogOrderKindValue = (typeof CatalogOrderKind)[keyof typeof CatalogOrderKind];

/**
 * An adjacent move direction.
 */
export type CatalogOrderDirectionValue =
  (typeof CatalogOrderDirection)[keyof typeof CatalogOrderDirection];

/**
 * The common fields used to order active records.
 */
export type OrderedCatalogRecord = ArchivableRecord & {
  id: string;
  sortOrder: number;
};
