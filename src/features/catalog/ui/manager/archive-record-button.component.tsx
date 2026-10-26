"use client";

import { Archive } from "lucide-react";
import { useTranslations } from "next-intl";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";

import { FormAlert } from "./form-fields.component";
import type { RecordActionValue } from "../../domain/manager";
import { useArchiveRecord } from "../../hooks/manager/use-archive-record.hook";

/**
 * Props for an archive button.
 */
type ArchiveRecordButtonProps = {
  action: RecordActionValue;
  recordId: string;
  recordName: string;
};

/**
 * Archives a record after the owner confirms it in a dialog.
 * @param props Which archive to run, the record's id and the name the dialog shows.
 * @returns The button and its confirmation.
 */
export function ArchiveRecordButton({ action, recordId, recordName }: ArchiveRecordButtonProps) {
  const { isOpen, setIsOpen, formAction, isPending, formError, fieldErrors } =
    useArchiveRecord(action);
  const translate = useTranslations("catalog.manager.actions");
  const errorMessage = useErrorMessage("catalog")(formError ?? fieldErrors.id);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <Archive aria-hidden />
          {translate("archive")}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={translate("cancel")} className="bg-paper">
        <ArchiveConfirmation
          recordId={recordId}
          recordName={recordName}
          formAction={formAction}
          isPending={isPending}
          errorMessage={errorMessage}
        />
      </DialogContent>
    </Dialog>
  );
}

/**
 * Props for the archive confirmation.
 */
type ArchiveConfirmationProps = {
  recordId: string;
  recordName: string;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  errorMessage: string | null;
};

/**
 * The confirmation's form: what archiving does, cancel, and the archive button.
 * @param props The record, the archive form's action and state, and the translated error.
 * @returns The form.
 */
function ArchiveConfirmation({
  recordId,
  recordName,
  formAction,
  isPending,
  errorMessage,
}: ArchiveConfirmationProps) {
  const translate = useTranslations("catalog.manager");

  return (
    <form action={formAction} className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{translate("archiveDialog.title", { name: recordName })}</DialogTitle>
        <DialogDescription>{translate("archiveDialog.description")}</DialogDescription>
      </DialogHeader>
      <input type="hidden" name="id" value={recordId} />
      <FormAlert message={errorMessage} />
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" size="sm">
            {translate("actions.cancel")}
          </Button>
        </DialogClose>
        <Button type="submit" variant="destructive" size="sm" disabled={isPending}>
          {isPending ? translate("actions.archiving") : translate("archiveDialog.confirm")}
        </Button>
      </DialogFooter>
    </form>
  );
}
