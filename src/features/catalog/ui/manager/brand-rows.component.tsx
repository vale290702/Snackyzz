"use client";

import { useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";

import { ArchiveRecordButton } from "./archive-record-button.component";
import { EditRecordButton } from "./edit-record-button.component";
import { RecordActionForm } from "./record-action-form.component";
import { RecordRow } from "./record-row.component";
import type { RecordActionValue } from "../../domain/manager";
import type { ManagedBrand } from "../../index";

/**
 * Props for the brand list.
 */
type BrandRowsProps = {
  brands: readonly ManagedBrand[];
  archiveAction: RecordActionValue;
  setPrimaryAction: RecordActionValue;
  onEdit: (brandId: string) => void;
};

/**
 * The brands list: logo, name, tagline, storefront path and position, and which one is primary.
 * @param props The brands, the archive and primary actions, and the edit handler.
 * @returns The list.
 */
export function BrandRows({ brands, archiveAction, setPrimaryAction, onEdit }: BrandRowsProps) {
  const translate = useTranslations("catalog.manager");

  return (
    <ul className="grid gap-3">
      {brands.map((brand) => {
        const isActive = brand.archivedAt === null;
        const canChangePrimary = isActive && !brand.isPrimary;

        return (
          <RecordRow
            key={brand.id}
            title={brand.name}
            imageUrl={brand.logoUrl}
            isActive={isActive}
            marks={
              brand.isPrimary && <Badge variant="selected">{translate("status.primary")}</Badge>
            }
            lines={[
              ...(brand.tagline ? [brand.tagline] : []),
              translate("rows.brandPlacement", { slug: brand.slug, position: brand.sortOrder }),
            ]}
            actions={
              <>
                <EditRecordButton recordName={brand.name} onEdit={() => onEdit(brand.id)} />
                {canChangePrimary && (
                  <RecordActionForm
                    action={setPrimaryAction}
                    recordId={brand.id}
                    label={translate("actions.setPrimary")}
                    pendingLabel={translate("actions.saving")}
                  />
                )}
                {canChangePrimary && (
                  <ArchiveRecordButton
                    action={archiveAction}
                    recordId={brand.id}
                    recordName={brand.name}
                  />
                )}
              </>
            }
          />
        );
      })}
    </ul>
  );
}
