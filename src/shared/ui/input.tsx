// shadcn/ui input. Local changes: paper background, warm-line outline, control radius, 49px height,
// 16px text at every width (stops iOS zoom), deep-orange focus outline with offset, warm-red tint
// when aria-invalid, legible disabled state instead of half opacity, no shadow, no dark mode.

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Single-line text input styled with the brand tokens.
 * @param props Native input props.
 * @returns The input element.
 */
function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12.25 w-full min-w-0 rounded-control border border-input bg-paper px-3.5 py-3 text-base text-foreground",
        "transition-colors outline-none placeholder:text-muted-foreground",
        "selection:bg-primary selection:text-primary-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "aria-invalid:border-destructive aria-invalid:bg-destructive/5",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
