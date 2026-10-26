import { RecordStatusFilter } from "./manager.constants";
import type { ArchivableRecord, RecordStatusFilterValue } from "./manager.types";

/**
 * Pure list rules for catalog management.
 */
export class ManagerRecords {
  private constructor() {}

  /**
   * Tells whether a record is still on sale or in use.
   * @param record The record.
   * @returns True until it is archived.
   */
  static isActive(record: ArchivableRecord): boolean {
    return record.archivedAt === null;
  }

  /**
   * Keeps the records a status filter shows.
   * @param records Records in display order.
   * @param status Which records to keep.
   * @returns The matching records, in the same order.
   */
  static withStatus<Record extends ArchivableRecord>(
    records: readonly Record[],
    status: RecordStatusFilterValue,
  ): Record[] {
    if (status === RecordStatusFilter.All) {
      return [...records];
    }

    const wantsActive = status === RecordStatusFilter.Active;

    return records.filter((record) => ManagerRecords.isActive(record) === wantsActive);
  }

  /**
   * Keeps the records that belong to a parent, such as a brand's products or a product's variants.
   * @param records Records in display order.
   * @param parentKey The field that names the parent.
   * @param parentId The parent to keep, or null to keep every record.
   * @returns The matching records, in the same order.
   */
  static ofParent<Record, Key extends keyof Record>(
    records: readonly Record[],
    parentKey: Key,
    parentId: Record[Key] | null,
  ): Record[] {
    if (parentId === null) {
      return [...records];
    }

    return records.filter((record) => record[parentKey] === parentId);
  }
}
