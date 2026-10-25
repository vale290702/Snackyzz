import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * Props for the admin header.
 */
type AdminHeaderProps = {
  /**
   * Controls for a signed-in admin, such as signing out; without them the header names the section.
   */
  actions?: ReactNode;
};

/**
 * The cream admin bar with the wordmark, shared by sign-in and the signed-in panel.
 * @param props Optional signed-in actions shown at the end of the bar.
 * @returns The header element.
 */
export function AdminHeader({ actions }: AdminHeaderProps) {
  const translate = useTranslations("access.header");

  return (
    <header className="grid min-h-19 grid-cols-[1fr_auto] items-center gap-2.5 border-b border-border bg-background px-5 py-3.5 sm:grid-cols-[1fr_auto_1fr] sm:gap-6 sm:px-[clamp(1.75rem,4vw,4rem)]">
      <span className="justify-self-start font-display text-wordmark max-sm:text-4xl max-sm:leading-none">
        {translate.rich("wordmark", {
          dot: (chunks) => <span className="text-orange-deep">{chunks}</span>,
        })}
      </span>
      {actions ? (
        <div className="justify-self-end sm:col-start-3">{actions}</div>
      ) : (
        <span className="text-xs tracking-widest text-muted-foreground uppercase sm:col-start-2">
          {translate("section")}
        </span>
      )}
    </header>
  );
}
