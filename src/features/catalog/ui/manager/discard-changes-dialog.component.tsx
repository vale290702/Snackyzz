import { useTranslations } from "next-intl";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { buttonVariants } from "@/shared/ui/button";

import { useDiscardChangesDialog } from "../../hooks/manager/use-discard-changes-dialog.hook";

/**
 * Props for the discard confirmation.
 */
type DiscardChangesDialogProps = {
  open: boolean;
  onCancel: () => void;
  onDiscard: () => void;
};

/**
 * Asks before leaving a record with unsaved changes; cancelling keeps the editor as it was.
 * @param props Whether it is open, and the cancel and discard handlers.
 * @returns The confirmation.
 */
export function DiscardChangesDialog({ open, onCancel, onDiscard }: DiscardChangesDialogProps) {
  const { rememberFocus, restoreFocus } = useDiscardChangesDialog();
  const translate = useTranslations("catalog.manager.discardDialog");

  // Unmount at once instead of animating out, so an Escape right after "keep editing" reaches
  // the editor rather than this closing layer.
  if (!open) return null;

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent onOpenAutoFocus={rememberFocus} onCloseAutoFocus={restoreFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>{translate("title")}</AlertDialogTitle>
          <AlertDialogDescription>{translate("description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className={buttonVariants({ variant: "outline" })}>
            {translate("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={onDiscard}
          >
            {translate("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
