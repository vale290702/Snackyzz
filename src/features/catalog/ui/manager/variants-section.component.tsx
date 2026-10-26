"use client";

import { Pencil, Plus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

import { ArchiveRecordButton } from "./archive-record-button.component";
import { RecordActionForm } from "./record-action-form.component";
import { VariantForm } from "./variant-form.component";
import { useVariantsSection } from "../../hooks/manager/use-variants-section.hook";
import type { Variant } from "../../index";

/**
 * Props for a product's variants.
 */
type VariantsSectionProps = {
  productId: string;
  variants: readonly Variant[];
};

/**
 * A product's variants: each one's price and position, its actions, and the variant editor.
 * @param props The product and its variants, archived ones included.
 * @returns The labelled section.
 */
export function VariantsSection({ productId, variants }: VariantsSectionProps) {
  const section = useVariantsSection(variants);
  const translate = useTranslations("catalog.manager");
  const format = useFormatter();

  return (
    <section
      aria-labelledby="variants-title"
      className="mt-8 grid gap-4 border-t border-border pt-6"
    >
      <div>
        <h3 id="variants-title" className="font-display text-xl leading-display font-bold">
          {translate("variants.title")}
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{translate("variants.description")}</p>
      </div>
      {section.activeVariants.length === 0 && (
        <p className="text-sm text-muted-foreground">{translate("variants.none")}</p>
      )}
      <ul className="grid gap-2.5">
        {section.activeVariants.map((variant) => (
          <li key={variant.id} className="grid gap-2 rounded-control border border-border p-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{variant.name}</span>
              {variant.isDefault && <Badge variant="selected">{translate("status.default")}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {translate(variant.sku ? "rows.variantSummaryWithSku" : "rows.variantSummary", {
                price: format.number(variant.price, {
                  style: "currency",
                  currency: "CRC",
                  maximumFractionDigits: 0,
                }),
                sku: variant.sku ?? "",
                position: variant.sortOrder,
              })}
            </p>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => section.edit(variant.id)}
                aria-label={translate("actions.editNamed", { name: variant.name })}
              >
                <Pencil aria-hidden />
                {translate("actions.edit")}
              </Button>
              {!variant.isDefault && (
                <RecordActionForm
                  action={section.setDefaultAction}
                  recordId={variant.id}
                  label={translate("actions.setDefault")}
                  pendingLabel={translate("actions.saving")}
                />
              )}
              <ArchiveRecordButton
                action={section.archiveAction}
                recordId={variant.id}
                recordName={variant.name}
              />
            </div>
          </li>
        ))}
      </ul>
      {section.isEditorOpen ? (
        <VariantForm
          key={section.editingId}
          productId={productId}
          variant={section.editingVariant}
          onSaved={section.closeEditor}
          onCancel={section.closeEditor}
        />
      ) : (
        <Button type="button" variant="outline" className="text-sm" onClick={section.startCreate}>
          <Plus aria-hidden />
          {translate("variants.createTitle")}
        </Button>
      )}
    </section>
  );
}
