"use client";

// shadcn/ui toggle. Local changes: the filter-pill look (fully rounded, warm-line border, 40px
// tall, 12px label, chocolate fill when on), deep-orange focus outline, no size or outline
// variants, no dark mode.

import { cva } from "class-variance-authority";
import { Toggle as TogglePrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

const toggleVariants = cva([
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-4",
  "text-xs font-medium whitespace-nowrap transition-colors hover:bg-accent",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep",
  "disabled:pointer-events-none disabled:opacity-50",
  "data-[state=on]:border-secondary data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground",
]);

/**
 * A two-state button (pressed or not).
 * @param props Radix toggle props (`pressed` / `onPressedChange` to control it).
 * @returns The toggle button.
 */
function Toggle({ className, ...props }: ComponentProps<typeof TogglePrimitive.Root>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants(), className)}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
