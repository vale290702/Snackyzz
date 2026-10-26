import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { Badge } from "@/shared/ui/badge";

/**
 * Props for one row of a manager list.
 */
type RecordRowProps = {
  title: string;
  lines: readonly string[];
  isActive: boolean;
  /**
   * A thumbnail, for records that have one; null shows an empty tile.
   */
  imageUrl?: string | null | undefined;
  /**
   * Extra chips after the status, such as "Principal".
   */
  marks?: ReactNode;
  actions: ReactNode;
};

/**
 * One record in a manager list: thumbnail, name, summary lines, status and actions.
 * @param props The record's text, status, optional thumbnail and marks, and its actions.
 * @returns The list item.
 */
export function RecordRow({ title, lines, isActive, imageUrl, marks, actions }: RecordRowProps) {
  const translate = useTranslations("catalog.manager.status");

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-surface border border-border bg-paper px-2.5 py-2">
      {imageUrl !== undefined && (
        <span className="size-18 shrink-0 overflow-hidden rounded-control bg-muted">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt=""
              width={72}
              height={72}
              unoptimized
              className="size-full object-cover"
            />
          )}
        </span>
      )}
      <div className="min-w-0 flex-1 basis-48">
        <h3 className="truncate text-sm font-bold">{title}</h3>
        {lines.map((line) => (
          <p key={line} className="mt-1 truncate text-xs text-muted-foreground">
            {line}
          </p>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 max-sm:basis-full">
        <Badge variant={isActive ? "positive" : "pending"}>
          {isActive ? translate("active") : translate("archived")}
        </Badge>
        {marks}
      </div>
      <div className="flex flex-wrap items-center gap-1">{actions}</div>
    </li>
  );
}
