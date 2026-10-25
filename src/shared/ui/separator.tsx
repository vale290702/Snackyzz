"use client";

// shadcn/ui separator (installed as a dependency of Field). Local changes: none beyond formatting
// and JSDoc; the line uses the warm-line border token.

import { Separator as SeparatorPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Thin warm divider, decorative unless told otherwise.
 * @param props Radix separator props.
 * @returns The separator element.
 */
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
