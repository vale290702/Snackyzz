"use client";

import { Pencil, Plus } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

import { ArchiveRecordButton } from "./archive-record-button.component";
import { DiscardChangesDialog } from "./discard-changes-dialog.component";
import { FormAlert } from "./form-fields.component";
import { RecordActionForm } from "./record-action-form.component";
import { RecordOrderControls } from "./record-order-controls.component";
import { VariantForm } from "./variant-form.component";
import {
  CatalogOrderKind,
  type useCatalogOrdering,
} from "../../hooks/manager/use-catalog-ordering.hook";
import { useVariantsSection } from "../../hooks/manager/use-variants-section.hook";
import type { Variant } from "../../index";

/**
 * Props for a product's variants.
 */
type VariantsSectionProps = {
  productId: string;
  variants: readonly Variant[];
  beforeEdit?: (() => boolean) | undefined;
  hasChanges?: (() => boolean) | undefined;
  isBusy?: (() => boolean) | undefined;
  onEditingChange?: ((open: boolean) => void) | undefined;
  onSaved?: (() => void) | undefined;
  ordering?: ReturnType<typeof useCatalogOrdering> | undefined;
};

/**
 * A product's variants: each one's price and position, its actions, and the variant editor.
 * @param props The product and its variants, archived ones included.
 * @returns The labelled section.
 */
export function VariantsSection({
  productId,
  variants,
  ordering,
  ...options
}: VariantsSectionProps) {
  const section = useVariantsSection(variants, options);
  const translate = useTranslations("catalog.manager");
  const format = useFormatter();
  const errorMessage = useErrorMessage("catalog");

  return (
    <section
      aria-busy={ordering?.isPending ?? false}
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
      {section.activeVariants.length > 1 && (
        <fieldset disabled={section.isEditorOpen} className="min-w-0">
          <ul className="grid gap-2.5">
            {section.activeVariants.map((variant) => (
              <li
                key={variant.id}
                className="grid gap-2 rounded-control border border-border p-3.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{variant.name}</span>
                  {variant.isDefault && (
                    <Badge variant="selected">{translate("status.default")}</Badge>
                  )}
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
                  {ordering && (
                    <RecordOrderControls
                      ordering={ordering}
                      kind={CatalogOrderKind.Variants}
                      recordId={variant.id}
                      recordName={variant.name}
                    />
                  )}
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
        </fieldset>
      )}
      {section.isEditorOpen ? (
        <VariantForm
          key={section.editingId}
          productId={productId}
          variant={section.editingVariant}
          onSaved={section.saved}
          onCancel={section.closeEditor}
        />
      ) : (
        <Button type="button" variant="outline" className="text-sm" onClick={section.startCreate}>
          <Plus aria-hidden />
          {translate("variants.createTitle")}
        </Button>
      )}
      {ordering && <FormAlert message={errorMessage(ordering.error)} />}
      <DiscardChangesDialog
        open={section.isDiscardOpen}
        onCancel={section.cancelDiscard}
        onDiscard={section.discardChanges}
      />
    </section>
  );
}
