// shadcn/ui button. Local changes: DESIGN.md variants (primary, dark, outline, ghost, link),
// 52px default height, control radius, lift on hover, deep-orange focus outline, no dark mode.

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap",
    "transition-[transform,background-color,color] outline-none hover:-translate-y-px",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-deep",
    "disabled:pointer-events-none disabled:opacity-60",
    "aria-invalid:outline-2 aria-invalid:outline-destructive",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-orange-deep",
        dark: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
        outline: "border border-chocolate bg-transparent hover:bg-accent",
        destructive: "bg-destructive text-paper hover:bg-destructive/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-foreground underline-offset-4 hover:translate-y-0 hover:underline",
      },
      size: {
        default: "h-13 px-6 text-base",
        sm: "h-10 px-4 text-sm",
        icon: "size-13",
        "icon-sm": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

/**
 * Action button styled with the brand tokens.
 * @param props Native button props plus `variant`, `size` and `asChild` to render a child element instead.
 * @returns The button element.
 */
function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot.Root : "button";

  return (
    <Component
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
