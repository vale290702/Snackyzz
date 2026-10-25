// shadcn/ui textarea. Local changes: same surface as Input (paper, warm-line outline, control radius,
// 16px text, deep-orange focus outline, warm-red invalid tint, legible disabled state), taller
// minimum height, no shadow, no dark mode.

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Multi-line text input that grows with its content.
 * @param props Native textarea props.
 * @returns The textarea element.
 */
function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-28 w-full rounded-control border border-input bg-paper px-3.5 py-3 text-base text-foreground",
        "transition-colors outline-none placeholder:text-muted-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "aria-invalid:border-destructive aria-invalid:bg-destructive/5",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
