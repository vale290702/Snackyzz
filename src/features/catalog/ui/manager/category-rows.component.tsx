"use client";

import { useTranslations } from "next-intl";

import { ArchiveRecordButton } from "./archive-record-button.component";
import { EditRecordButton } from "./edit-record-button.component";
import { RecordOrderControls } from "./record-order-controls.component";
import { RecordRow } from "./record-row.component";
import type { RecordActionValue } from "../../domain/manager";
import { CatalogOrderKind } from "../../hooks/manager/use-catalog-ordering.hook";
import type { useCatalogOrdering } from "../../hooks/manager/use-catalog-ordering.hook";
import type { Category } from "../../index";

/**
 * Props for the category list.
 */
type CategoryRowsProps = {
  categories: readonly Category[];
  archiveAction: RecordActionValue;
  ordering?: ReturnType<typeof useCatalogOrdering> | undefined;
  onEdit: (categoryId: string) => void;
};

/**
 * The categories list: name, slug and position.
 * @param props The categories, the archive action and the edit handler.
 * @returns The list.
 */
export function CategoryRows({ categories, archiveAction, onEdit, ordering }: CategoryRowsProps) {
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
              {ordering && category.archivedAt === null && (
                <RecordOrderControls
                  ordering={ordering}
                  kind={CatalogOrderKind.Categories}
                  recordId={category.id}
                  recordName={category.name}
                />
              )}
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
