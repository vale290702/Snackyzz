import { CatalogOrderDirection } from "./catalog-ordering.constants";
import type { CatalogOrderDirectionValue, OrderedCatalogRecord } from "./catalog-ordering.types";

/**
 * Plans adjacent catalog moves without mutating source records.
 */
export class CatalogOrdering {
  private constructor() {}

  /**
   * Orders records numerically, retaining source order for tied ranks.
   * @param records Current server records in deterministic query order.
   * @returns A sorted copy for display and move planning.
   */
  static ordered<Record extends OrderedCatalogRecord>(records: readonly Record[]): Record[] {
    return [...records].sort((first, second) => first.sortOrder - second.sortOrder);
  }

  private static scope<Record extends OrderedCatalogRecord>(
    records: readonly Record[],
    id: string,
    parentKey?: keyof Record,
  ): Record[] {
    const selected = records.find((record) => record.id === id);
    if (!selected || selected.archivedAt !== null) {
      return [];
    }

    const scoped = records.filter((record) => {
      const sharesParent = parentKey === undefined || record[parentKey] === selected[parentKey];
      return record.archivedAt === null && sharesParent;
    });

    return CatalogOrdering.ordered(scoped);
  }

  /**
   * Checks whether a record has an active neighbor in the requested direction.
   * @param records Source list in deterministic display order.
   * @param id Record to move.
   * @param direction Which neighbor to move past.
   * @param parentKey Optional parent field that defines the list's scope.
   * @returns Whether the adjacent move is available.
   */
  static canMove<Record extends OrderedCatalogRecord>(
    records: readonly Record[],
    id: string,
    direction: CatalogOrderDirectionValue,
    parentKey?: keyof Record,
  ): boolean {
    const scoped = CatalogOrdering.scope(records, id, parentKey);
    const index = scoped.findIndex((record) => record.id === id);
    const neighbor = index + (direction === CatalogOrderDirection.Up ? -1 : 1);
    return index !== -1 && neighbor >= 0 && neighbor < scoped.length;
  }

  /**
   * Plans a normalized final sequence and returns only records whose rank changes.
   * @param records Source list in deterministic display order.
   * @param id Record to move.
   * @param direction Which neighbor to move past.
   * @param parentKey Optional parent field that defines the list's scope.
   * @returns Changed full records in their final sequence, or none for an unavailable move.
   */
  static move<Record extends OrderedCatalogRecord>(
    records: readonly Record[],
    id: string,
    direction: CatalogOrderDirectionValue,
    parentKey?: keyof Record,
  ): Record[] {
    if (!CatalogOrdering.canMove(records, id, direction, parentKey)) {
      return [];
    }

    const scoped = CatalogOrdering.scope(records, id, parentKey);
    const index = scoped.findIndex((record) => record.id === id);
    const neighbor = index + (direction === CatalogOrderDirection.Up ? -1 : 1);
    const moved = scoped.splice(index, 1);
    scoped.splice(neighbor, 0, ...moved);

    return scoped.flatMap((record, sortOrder) =>
      record.sortOrder === sortOrder ? [] : [{ ...record, sortOrder }],
    );
  }
}
