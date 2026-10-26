"use client";

import { useTranslations } from "next-intl";

import { ArchiveRecordButton } from "./archive-record-button.component";
import { EditRecordButton } from "./edit-record-button.component";
import { RecordRow } from "./record-row.component";
import type { RecordActionValue } from "../../domain/manager";
import type { Category } from "../../index";

/**
 * Props for the category list.
 */
type CategoryRowsProps = {
  categories: readonly Category[];
  archiveAction: RecordActionValue;
  onEdit: (categoryId: string) => void;
};

/**
 * The categories list: name, slug and position.
 * @param props The categories, the archive action and the edit handler.
 * @returns The list.
 */
export function CategoryRows({ categories, archiveAction, onEdit }: CategoryRowsProps) {
  const translate = useTranslations("catalog.manager.rows");

  return (
    <ul className="grid gap-3">
      {categories.map((category) => (
        <RecordRow
          key={category.id}
          title={category.name}
          isActive={category.archivedAt === null}
          lines={[
            translate("categoryPlacement", { slug: category.slug, position: category.sortOrder }),
          ]}
          actions={
            <>
              <EditRecordButton recordName={category.name} onEdit={() => onEdit(category.id)} />
              {category.archivedAt === null && (
                <ArchiveRecordButton
                  action={archiveAction}
                  recordId={category.id}
                  recordName={category.name}
                />
              )}
            </>
          }
        />
      ))}
    </ul>
  );
}
