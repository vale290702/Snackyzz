"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";

import type { CatalogOrderKindValue } from "../../domain/manager/catalog-ordering.types";
import { CatalogOrderDirection } from "../../hooks/manager/use-catalog-ordering.hook";
import type { useCatalogOrdering } from "../../hooks/manager/use-catalog-ordering.hook";

/**
 * Rendering inputs for a record's adjacent ordering controls.
 */
type RecordOrderControlsProps = {
  ordering: ReturnType<typeof useCatalogOrdering>;
  kind: CatalogOrderKindValue;
  recordId: string;
  recordName: string;
};

/**
 * Renders accessible adjacent-move controls using the manager's shared ordering state.
 * @param props Record identity and the shared move handlers.
 * @returns Named up/down buttons with disabled boundaries and touch-sized targets.
 */
export function RecordOrderControls({
  ordering,
  kind,
  recordId,
  recordName,
}: RecordOrderControlsProps) {
  const translate = useTranslations("catalog.manager.ordering");

  return (
    <div role="group" aria-label={translate("label", { name: recordName })} className="flex gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="min-h-11 min-w-11"
        aria-label={translate("moveUp", { name: recordName })}
        disabled={ordering.isPending || !ordering.canMove(kind, recordId, CatalogOrderDirection.Up)}
        onClick={() => ordering.move(kind, recordId, CatalogOrderDirection.Up)}
      >
        <ArrowUp aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="min-h-11 min-w-11"
        aria-label={translate("moveDown", { name: recordName })}
        disabled={
          ordering.isPending || !ordering.canMove(kind, recordId, CatalogOrderDirection.Down)
        }
        onClick={() => ordering.move(kind, recordId, CatalogOrderDirection.Down)}
      >
        <ArrowDown aria-hidden />
      </Button>
    </div>
  );
}
