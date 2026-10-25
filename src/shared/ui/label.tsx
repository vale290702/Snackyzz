"use client";

// shadcn/ui label. Local changes: snug leading, disabled peers dim to 70% instead of 50% so the
// text stays legible.

import { Label as LabelPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Accessible label for a form control.
 * @param props Radix label props; pair `htmlFor` with the control's `id`.
 * @returns The label element.
 */
function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-snug font-medium select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-70",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
