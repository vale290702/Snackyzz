import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";

/**
 * Confirms leaving a catalog record while preserving the interrupted editor on cancellation.
 * @param props The confirmation state and explicit discard/cancel handlers.
 * @returns The modal discard confirmation.
 */
export function DiscardChangesDialog({
  open,
  onCancel,
  onDiscard,
}: {
  open: boolean;
  onCancel: () => void;
  onDiscard: () => void;
}) {
  const translate = useTranslations("catalog.manager.discardDialog");
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="data-[state=closed]:animate-none">
        <DialogTitle>{translate("title")}</DialogTitle>
        <DialogDescription>{translate("description")}</DialogDescription>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="outline" onClick={onCancel}>
            {translate("cancel")}
          </Button>
          <Button variant="destructive" onClick={onDiscard}>
            {translate("confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
