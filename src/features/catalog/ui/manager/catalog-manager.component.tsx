"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { Button } from "@/shared/ui/button";
import { Toaster } from "@/shared/ui/sonner";

import { BrandRows } from "./brand-rows.component";
import { CatalogEditor } from "./catalog-editor.component";
import { CategoryRows } from "./category-rows.component";
import { DiscardChangesDialog } from "./discard-changes-dialog.component";
import { FilterPills } from "./filter-pills.component";
import { FormAlert } from "./form-fields.component";
import { ProductRows } from "./product-rows.component";
import { ViewTabs } from "./view-tabs.component";
import { useCatalogManager } from "../../hooks/manager/use-catalog-manager.hook";
import type { CatalogManagerData } from "../../index";

/**
 * Props for the catalog manager.
 */
type CatalogManagerProps = {
  data: CatalogManagerData;
};

/**
 * The owner's catalog panel: products, brands and categories, with filters and an editor.
 * @param props Every brand, category, product and variant, archived ones included.
 * @returns The manager.
 */
export function CatalogManager({ data }: CatalogManagerProps) {
  const manager = useCatalogManager(data);
  const translate = useTranslations("catalog.manager");
  const errorMessage = useErrorMessage("catalog");
  const { view, recordActions } = manager;

  return (
    <div className="grid gap-8">
      <ViewTabs
        label={translate("viewsLabel")}
        options={manager.viewOptions.map((value) => ({
          value,
          label: translate(`views.${value}`),
        }))}
        value={view}
        onSelect={manager.selectView}
      />
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display text-5xl leading-display font-bold tracking-display md:text-6xl">
            {translate(`titles.${view}`)}
          </h1>
          <p className="mt-3 text-muted-foreground">{translate(`descriptions.${view}`)}</p>
        </div>
        <Button
          type="button"
          variant="dark"
          onClick={manager.startCreate}
          disabled={manager.ordering.isPending}
          className="gap-5 text-sm font-bold max-sm:h-10 max-sm:text-xs"
        >
          {translate(`create.${view}`)}
          <Plus aria-hidden />
        </Button>
      </header>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {manager.showsProducts && (
          <FilterPills
            label={translate("filters.brandLabel")}
            options={manager.brandFilterOptions.map(({ value, name }) => ({
              value,
              label: name ?? translate("filters.allBrands"),
            }))}
            value={manager.brandFilter}
            onSelect={manager.selectBrandFilter}
          />
        )}
        <FilterPills
          label={translate("filters.statusLabel")}
          options={manager.statusOptions.map((value) => ({
            value,
            label: translate(`filters.${value}`),
          }))}
          value={manager.status}
          onSelect={manager.selectStatus}
        />
      </div>
      <div className="grid items-start gap-6">
        <FormAlert message={errorMessage(manager.ordering.error)} />
        <section aria-label={translate(`views.${view}`)} className="grid gap-3">
          {!manager.hasRecords && (
            <EmptyRecords title={translate("empty.noneTitle")} body={translate(`empty.${view}`)} />
          )}
          {manager.hasRecords && manager.visibleCount === 0 && (
            <EmptyRecords
              title={translate("empty.noMatchesTitle")}
              body={translate("empty.noMatches")}
            />
          )}
          {manager.showsProducts && (
            <ProductRows
              rows={manager.productRows}
              archiveAction={recordActions.ArchiveProduct}
              onEdit={manager.edit}
              ordering={manager.ordering}
            />
          )}
          {manager.showsBrands && (
            <BrandRows
              brands={manager.brands}
              archiveAction={recordActions.ArchiveBrand}
              setPrimaryAction={recordActions.SetPrimaryBrand}
              onEdit={manager.edit}
              ordering={manager.ordering}
            />
          )}
          {manager.showsCategories && (
            <CategoryRows
              categories={manager.categories}
              archiveAction={recordActions.ArchiveCategory}
              onEdit={manager.edit}
              ordering={manager.ordering}
            />
          )}
        </section>
        {manager.isEditorOpen && <CatalogEditor key={manager.editingId} manager={manager} />}
      </div>
      <DiscardChangesDialog
        open={manager.isDiscardOpen}
        onCancel={manager.cancelDiscard}
        onDiscard={manager.discardChanges}
      />
      <Toaster containerAriaLabel={translate("feedbackLabel")} />
    </div>
  );
}

/**
 * The paper card shown when a list has nothing to show.
 * @param props The title and the hint.
 * @returns The card.
 */
function EmptyRecords({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-surface border border-dashed border-border bg-paper p-8 text-center">
      <p className="font-display text-2xl leading-display font-bold">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
