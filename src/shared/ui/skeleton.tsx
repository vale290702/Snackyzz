// shadcn/ui skeleton. Local changes: cream-tint fill with the control radius, pulse only when the
// user allows motion.

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * A decorative placeholder shaped like content that is still loading.
 * @param props Native div props; size it with classes.
 * @returns The placeholder block.
 */
function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("rounded-control bg-cream-tint motion-safe:animate-pulse", className)}
      {...props}
    />
  );
}

export { Skeleton };
