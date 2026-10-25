"use client";

// shadcn/ui radio group. Local changes: 24px items (WCAG 2.2 target size), paper fill, muted-brown
// outline (warm-line is below 3:1), chocolate ring and dot when checked, deep-orange focus outline,
// warm-red when aria-invalid, no shadow, no dark mode.

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Group of mutually exclusive options; arrow keys move between items.
 * @param props Radix radio group props.
 * @returns The radio group element.
 */
function RadioGroup({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}

/**
 * One option inside a `RadioGroup`.
 * @param props Radix radio item props; label it with `Label` or `FieldLabel`.
 * @returns The radio button.
 */
function RadioGroupItem({ className, ...props }: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "peer aspect-square size-6 shrink-0 rounded-full border border-muted-foreground bg-paper",
        "transition-colors outline-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "data-[state=checked]:border-2 data-[state=checked]:border-secondary",
        "aria-invalid:border-destructive",
        "disabled:cursor-not-allowed disabled:border-border disabled:bg-muted",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex items-center justify-center"
      >
        <span className="size-2.5 rounded-full bg-secondary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
