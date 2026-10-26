import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/shared/ui/sheet";

/**
 * Props for the editor panel.
 */
type EditorPanelProps = {
  title: string;
  onClose: () => void;
  onCloseAutoFocus: (event: Event) => void;
  children: ReactNode;
};

/**
 * The sheet that holds a record's form: from the right on desktop, full height on phones. Its body
 * scrolls on its own.
 * @param props The editor's title, the close and focus-return handlers, and the form.
 * @returns The sheet.
 */
export function EditorPanel({ title, onClose, onCloseAutoFocus, children }: EditorPanelProps) {
  const translate = useTranslations("catalog.manager.actions");

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        aria-labelledby="catalog-editor-title"
        aria-describedby={undefined}
        onCloseAutoFocus={onCloseAutoFocus}
        className="h-dvh gap-0 bg-paper sm:max-w-2xl"
      >
        <SheetHeader className="shrink-0 border-b border-border p-6 pr-20">
          <SheetTitle id="catalog-editor-title">{title}</SheetTitle>
          <CloseEditorButton onClose={onClose} label={translate("closeEditor")} />
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

function CloseEditorButton({ onClose, label }: { onClose: () => void; label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="absolute top-4 right-4 size-11"
      onClick={onClose}
      aria-label={label}
    >
      <X aria-hidden />
    </Button>
  );
}
