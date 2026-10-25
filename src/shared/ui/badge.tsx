// shadcn/ui badge. Local changes: fully rounded chip, DESIGN.md variants (neutral, brand, selected,
// outline) plus status tones (pending, positive, negative) as 15% tints with their own ink color
// (4.5:1 on paper and cream), deep-orange focus outline for linked badges, no dark mode.

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

const badgeVariants = cva(
  [
    "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent",
    "px-2.5 py-1 text-xs leading-none font-semibold whitespace-nowrap transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "[&>svg]:pointer-events-none [&>svg]:size-3",
  ],
  {
    variants: {
      variant: {
        neutral: "bg-muted text-foreground [a&]:hover:bg-warm-line",
        brand: "bg-primary text-primary-foreground [a&]:hover:bg-orange-deep",
        selected: "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        outline: "border-border text-foreground [a&]:hover:bg-accent",
        pending: "bg-honey/15 text-honey",
        positive: "bg-leaf/15 text-leaf",
        negative: "bg-destructive/15 text-destructive",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

type BadgeProps = ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean;
  };

/**
 * Compact rounded chip for counts, filters and statuses.
 * @param props Native span props plus `variant` and `asChild` to render a link or button instead.
 * @returns The badge element.
 */
function Badge({ className, variant = "neutral", asChild = false, ...props }: BadgeProps) {
  const Component = asChild ? Slot.Root : "span";

  return (
    <Component
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
