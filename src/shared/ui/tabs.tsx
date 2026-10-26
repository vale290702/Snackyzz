"use client";

// shadcn/ui tabs. Local changes: only the underlined "line" look of the admin section tabs
// (12px muted labels, deep-orange 2px underline and bold chocolate label when active, warm-line
// rule under the list), deep-orange focus outline, no pill variant, no dark mode.

import { Tabs as TabsPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Tabs root; arrow keys move between triggers.
 * @param props Radix tabs root props (`value` / `onValueChange` to control it).
 * @returns The tabs root.
 */
function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("grid gap-6", className)} {...props} />;
}

/**
 * The row of triggers, labelled with `aria-label`.
 * @param props Radix list props.
 * @returns The tab list.
 */
function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("flex gap-2 border-b border-border", className)}
      {...props}
    />
  );
}

/**
 * One tab.
 * @param props Radix trigger props with the tab's `value`.
 * @returns The tab button.
 */
function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "-mb-px border-b-2 border-transparent px-4.5 py-3 text-xs whitespace-nowrap text-muted-foreground",
        "focus-visible:outline-2 focus-visible:outline-orange-deep disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:border-orange-deep data-[state=active]:font-bold data-[state=active]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The panel shown for one tab.
 * @param props Radix content props with the tab's `value`.
 * @returns The tab panel.
 */
function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
