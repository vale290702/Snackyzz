"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { Button } from "@/shared/ui/button";

import { BrandRows } from "./brand-rows.component";
import { CategoryRows } from "./category-rows.component";
import { FilterPills } from "./filter-pills.component";
import { FormAlert } from "./form-fields.component";
import { ProductRows } from "./product-rows.component";
import type { useCatalogManager } from "../../hooks/manager/use-catalog-manager.hook";

/**
 * Props shared by the manager's parts.
 */
type ManagerPartProps = {
  manager: ReturnType<typeof useCatalogManager>;
};

/**
 * The open section's title, description and create button.
 * @param props The manager's state.
 * @returns The header.
 */
export function ManagerHeading({ manager }: ManagerPartProps) {
  const translate = useTranslations("catalog.manager");

  return (
    <header className="flex flex-wrap items-end justify-between gap-5">
      <div>
        <h1 className="font-display text-5xl leading-display font-bold tracking-display md:text-6xl">
          {translate(`titles.${manager.view}`)}
        </h1>
        <p className="mt-3 text-muted-foreground">{translate(`descriptions.${manager.view}`)}</p>
      </div>
      <Button
        type="button"
        variant="dark"
        onClick={manager.startCreate}
        disabled={manager.ordering.isPending}
        className="gap-5 text-sm font-bold max-sm:h-10 max-sm:text-xs"
      >
        {translate(`create.${manager.view}`)}
        <Plus aria-hidden />
      </Button>
    </header>
  );
}

/**
 * The brand (products only) and status filters.
 * @param props The manager's state.
 * @returns The filter row.
 */
export function ManagerFilters({ manager }: ManagerPartProps) {
  const translate = useTranslations("catalog.manager.filters");

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3">
      {manager.showsProducts && (
        <FilterPills
          label={translate("brandLabel")}
          options={manager.brandFilterOptions.map(({ value, name }) => ({
            value,
            label: name ?? translate("allBrands"),
          }))}
          value={manager.brandFilter}
          onSelect={manager.selectBrandFilter}
        />
      )}
      <FilterPills
        label={translate("statusLabel")}
        options={manager.statusOptions.map((value) => ({ value, label: translate(value) }))}
        value={manager.status}
        onSelect={manager.selectStatus}
      />
    </div>
  );
}

/**
 * The open section's rows, or why there are none.
 * @param props The manager's state.
 * @returns The labelled list region.
 */
export function ManagerRecords({ manager }: ManagerPartProps) {
  const translate = useTranslations("catalog.manager");
  const errorMessage = useErrorMessage("catalog");
  const { recordActions, ordering } = manager;

  return (
    <section aria-label={translate(`views.${manager.view}`)} className="grid gap-3">
      <FormAlert message={errorMessage(ordering.error)} />
      {!manager.hasRecords && (
        <EmptyRecords
          title={translate("empty.noneTitle")}
          body={translate(`empty.${manager.view}`)}
        />
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
          ordering={ordering}
        />
      )}
      {manager.showsBrands && (
        <BrandRows
          brands={manager.brands}
          archiveAction={recordActions.ArchiveBrand}
          setPrimaryAction={recordActions.SetPrimaryBrand}
          onEdit={manager.edit}
          ordering={ordering}
        />
      )}
      {manager.showsCategories && (
        <CategoryRows
          categories={manager.categories}
          archiveAction={recordActions.ArchiveCategory}
          onEdit={manager.edit}
          ordering={ordering}
        />
      )}
    </section>
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
