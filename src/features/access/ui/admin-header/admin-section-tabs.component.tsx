import Link from "next/link";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/cn";

import { ADMIN_SECTION_TABS } from "./admin-sections.constants";
import type { AdminSectionValue } from "./admin-sections.types";

/**
 * Props for the admin section tabs.
 */
type AdminSectionTabsProps = {
  activeSection: AdminSectionValue;
};

/**
 * The admin header's section links, with the open section underlined.
 * @param props The section the page belongs to.
 * @returns The labelled navigation.
 */
export function AdminSectionTabs({ activeSection }: AdminSectionTabsProps) {
  const translate = useTranslations("access.header");

  return (
    <nav
      aria-label={translate("sectionsLabel")}
      className="col-span-full row-start-2 flex justify-center gap-2 sm:col-span-1 sm:col-start-2 sm:row-start-1"
    >
      {ADMIN_SECTION_TABS.map(({ section, href }) => {
        const isActive = section === activeSection;

        return (
          <Link
            key={section}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "border-b-2 px-4.5 py-3 text-xs focus-visible:outline-2 focus-visible:outline-orange-deep",
              isActive
                ? "border-orange-deep font-bold text-foreground"
                : "border-transparent text-muted-foreground",
            )}
          >
            {translate(`sections.${section}`)}
          </Link>
        );
      })}
    </nav>
  );
}
