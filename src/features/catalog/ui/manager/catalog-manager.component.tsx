"use client";

import { useTranslations } from "next-intl";

import { Toaster } from "@/shared/ui/sonner";

import { CatalogEditor } from "./catalog-editor.component";
import { ManagerFilters, ManagerHeading, ManagerRecords } from "./catalog-manager-parts.component";
import { DiscardChangesDialog } from "./discard-changes-dialog.component";
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

  return (
    <>
      <ViewTabs
        label={translate("viewsLabel")}
        options={manager.viewOptions.map((value) => ({
          value,
          label: translate(`views.${value}`),
        }))}
        value={manager.view}
        onSelect={manager.selectView}
      >
        <ManagerHeading manager={manager} />
        <ManagerFilters manager={manager} />
        <ManagerRecords manager={manager} />
      </ViewTabs>
      {manager.isEditorOpen && <CatalogEditor key={manager.editingId} manager={manager} />}
      <DiscardChangesDialog
        open={manager.isDiscardOpen}
        onCancel={manager.cancelDiscard}
        onDiscard={manager.discardChanges}
      />
      <Toaster containerAriaLabel={translate("feedbackLabel")} />
    </>
  );
}
