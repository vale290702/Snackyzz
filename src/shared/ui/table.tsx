// shadcn/ui table. Local changes: Server Component (no "use client"; nothing here is
// interactive), warm-line row dividers, muted-brown header text, cream-tint hover and selected
// rows, 12px cell padding with 44px header height for touch, checkbox nudge without arbitrary
// translate, no dark mode. The wrapper scrolls sideways so wide tables never widen the page.

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Data table inside a horizontally scrolling container.
 * @param props Native table props.
 * @returns The table wrapper and table.
 */
function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}

/**
 * Table head section.
 * @param props Native thead props.
 * @returns The thead element.
 */
function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />;
}

/**
 * Table body section.
 * @param props Native tbody props.
 * @returns The tbody element.
 */
function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

/**
 * Table footer for totals.
 * @param props Native tfoot props.
 * @returns The tfoot element.
 */
function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("border-t bg-muted font-medium [&>tr]:last:border-b-0", className)}
      {...props}
    />
  );
}

/**
 * Table row; set `data-state="selected"` to highlight it.
 * @param props Native tr props.
 * @returns The tr element.
 */
function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/50",
        "has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Column header cell.
 * @param props Native th props.
 * @returns The th element.
 */
function TableHead({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-11 px-3 text-left align-middle text-xs font-semibold whitespace-nowrap text-muted-foreground",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Body cell.
 * @param props Native td props.
 * @returns The td element.
 */
function TableCell({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-3 align-middle whitespace-nowrap",
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Caption that describes the table for screen readers and sighted users.
 * @param props Native caption props.
 * @returns The caption element.
 */
function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
