"use client";

// shadcn/ui checkbox. Local changes: 24px box (WCAG 2.2 target size), paper fill, muted-brown
// outline because an unchecked box has no other cue (warm-line is below 3:1), control radius,
// checked state inverts to chocolate and cream, deep-orange focus outline, warm-red when
// aria-invalid, no shadow, no dark mode.

import { CheckIcon } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Checkbox for independent on/off choices.
 * @param props Radix checkbox props; label it with `Label` or `FieldLabel`.
 * @returns The checkbox button.
 */
function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-6 shrink-0 rounded-control border border-muted-foreground bg-paper text-secondary-foreground",
        "transition-colors outline-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "data-[state=checked]:border-secondary data-[state=checked]:bg-secondary",
        "aria-invalid:border-destructive",
        "disabled:cursor-not-allowed disabled:border-border disabled:bg-muted",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-4" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
