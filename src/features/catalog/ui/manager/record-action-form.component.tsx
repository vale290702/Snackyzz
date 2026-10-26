"use client";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { Button } from "@/shared/ui/button";

import type { RecordActionValue } from "../../domain/manager";
import { useRecordAction } from "../../hooks/manager/use-record-action.hook";

/**
 * Props for a one-button record change.
 */
type RecordActionFormProps = {
  action: RecordActionValue;
  recordId: string;
  label: string;
  pendingLabel: string;
};

/**
 * A one-button form that makes a record the primary brand or default variant.
 * @param props The change, the record's id and the button's labels.
 * @returns The form.
 */
export function RecordActionForm({ action, recordId, label, pendingLabel }: RecordActionFormProps) {
  const { formAction, isPending, formError, fieldErrors } = useRecordAction(action);
  const errorMessage = useErrorMessage("catalog")(formError ?? fieldErrors.id);

  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="id" value={recordId} />
      <Button type="submit" variant="ghost" size="sm" disabled={isPending}>
        {isPending ? pendingLabel : label}
      </Button>
      {errorMessage && (
        <p role="alert" className="basis-full text-sm text-destructive">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
