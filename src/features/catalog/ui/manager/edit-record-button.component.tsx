import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";

/**
 * Props for an edit button.
 */
type EditRecordButtonProps = {
  recordName: string;
  onEdit: () => void;
};

/**
 * Opens a record in the editor; its accessible name says which record.
 * @param props The record's name and the handler.
 * @returns The button.
 */
export function EditRecordButton({ recordName, onEdit }: EditRecordButtonProps) {
  const translate = useTranslations("catalog.manager.actions");

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onEdit}
      aria-label={translate("editNamed", { name: recordName })}
    >
      <Pencil aria-hidden />
      {translate("edit")}
    </Button>
  );
}
