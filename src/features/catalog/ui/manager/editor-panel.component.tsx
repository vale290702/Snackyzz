import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";

/**
 * Props for the editor panel.
 */
type EditorPanelProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * The sticky paper panel beside the list that holds a record's form; it scrolls on its own when
 * taller than the window.
 * @param props The editor's title, the close handler and the form.
 * @returns The labelled region.
 */
export function EditorPanel({ title, onClose, children }: EditorPanelProps) {
  const translate = useTranslations("catalog.manager.actions");

  return (
    <section
      aria-labelledby="catalog-editor-title"
      className="rounded-surface border border-border bg-paper p-6 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:self-start lg:overflow-y-auto"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <h2 id="catalog-editor-title" className="font-display text-2xl leading-display font-bold">
          {title}
        </h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label={translate("closeEditor")}
        >
          <X aria-hidden />
        </Button>
      </div>
      {children}
    </section>
  );
}
