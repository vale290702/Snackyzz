// shadcn/ui card. Local changes: paper surface with surface radius, flat (no border, no shadow;
// tone separates it from the cream canvas), Fraunces title at title size, 24px padding that
// tightens to 16px on phones, no dark mode. CardAction is dropped: its grid template needs
// arbitrary values, and a header with an action can lay itself out with flex.

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Paper working surface for forms, carts and order panels.
 * @param props Native div props.
 * @returns The card container.
 */
function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-6 rounded-surface bg-card py-4 text-card-foreground sm:py-6",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Card heading area for the title and description.
 * @param props Native div props.
 * @returns The header element.
 */
function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-2 px-4 sm:px-6 [.border-b]:pb-6", className)}
      {...props}
    />
  );
}

/**
 * Card title in the display face.
 * @param props Native div props.
 * @returns The title element.
 */
function CardTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-display text-2xl leading-tight font-bold", className)}
      {...props}
    />
  );
}

/**
 * Supporting copy under the card title.
 * @param props Native div props.
 * @returns The description element.
 */
function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * Main card body.
 * @param props Native div props.
 * @returns The content element.
 */
function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-4 sm:px-6", className)} {...props} />;
}

/**
 * Row of actions or totals at the bottom of the card.
 * @param props Native div props.
 * @returns The footer element.
 */
function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-4 sm:px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
