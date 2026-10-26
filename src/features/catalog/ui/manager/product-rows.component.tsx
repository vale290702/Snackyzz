"use client";

import { useFormatter, useTranslations } from "next-intl";

import { ArchiveRecordButton } from "./archive-record-button.component";
import { EditRecordButton } from "./edit-record-button.component";
import { RecordRow } from "./record-row.component";
import type { RecordActionValue } from "../../domain/manager";
import type { ProductRow } from "../../hooks/manager/use-catalog-manager.hook";

/**
 * Props for the product list.
 */
type ProductRowsProps = {
  rows: readonly ProductRow[];
  archiveAction: RecordActionValue;
  onEdit: (productId: string) => void;
};

/**
 * The products list: image, name, badge, price, variant count, brand and position.
 * @param props The rows, the archive action and the edit handler.
 * @returns The list.
 */
export function ProductRows({ rows, archiveAction, onEdit }: ProductRowsProps) {
  const translate = useTranslations("catalog.manager.rows");
  const format = useFormatter();

  return (
    <ul className="grid gap-3">
      {rows.map(({ product, brandLabel, defaultPrice, activeVariantCount }) => {
        const summary = {
          badge: product.badge ?? "",
          price: format.number(defaultPrice ?? 0, {
            style: "currency",
            currency: "CRC",
            maximumFractionDigits: 0,
          }),
          variants: activeVariantCount,
        };

        return (
          <RecordRow
            key={product.id}
            title={product.name}
            imageUrl={product.imageUrl}
            isActive={product.archivedAt === null}
            lines={[
              translate(product.badge ? "productSummaryWithBadge" : "productSummary", summary),
              translate("productPlacement", {
                brand: brandLabel ?? "",
                position: product.sortOrder,
              }),
            ]}
            actions={
              <>
                <EditRecordButton recordName={product.name} onEdit={() => onEdit(product.id)} />
                {product.archivedAt === null && (
                  <ArchiveRecordButton
                    action={archiveAction}
                    recordId={product.id}
                    recordName={product.name}
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
