"use client";

// shadcn/ui toggle-group. Local changes: items keep the filter-pill `toggleVariants` and wrap
// with an 8px gap instead of joining into one segmented control; no size or variant context.

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";
import { toggleVariants } from "@/shared/ui/toggle";

/**
 * A group of toggles, labelled with `aria-label`; `type="single"` keeps one chosen.
 * @param props Radix toggle-group root props.
 * @returns The group.
 */
function ToggleGroup({ className, ...props }: ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  );
}

/**
 * One choice of the group.
 * @param props Radix item props with the item's `value`.
 * @returns The toggle button.
 */
function ToggleGroupItem({
  className,
  ...props
}: ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(toggleVariants(), className)}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
