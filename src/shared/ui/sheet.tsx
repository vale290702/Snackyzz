"use client";

// shadcn/ui sheet. Local changes: paper panel, flat (no shadow; a warm-line edge where it meets
// the page), chocolate-tinted overlay instead of black, side panels are full width on phones and
// 384px from the sm breakpoint, bottom sheet gets top surface radius, Fraunces title, close button
// is an icon Button that renders only when the caller passes `closeLabel` (no built-in English
// text), 16px padding at every edge, no dark mode.

import { XIcon } from "lucide-react";
import { Dialog as SheetPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

/**
 * Side panel root (a dialog that slides in from an edge).
 * @param props Radix dialog root props.
 * @returns The sheet root.
 */
function Sheet(props: ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

/**
 * Element that opens the sheet; use `asChild` with a `Button`.
 * @param props Radix trigger props.
 * @returns The trigger element.
 */
function SheetTrigger(props: ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

/**
 * Element that closes the sheet; use `asChild` with a `Button`.
 * @param props Radix close props.
 * @returns The close element.
 */
function SheetClose(props: ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

/**
 * Portal that renders sheet parts at the end of the body.
 * @param props Radix portal props.
 * @returns The portal.
 */
function SheetPortal(props: ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

/**
 * Dimmed backdrop behind the sheet.
 * @param props Radix overlay props.
 * @returns The overlay element.
 */
function SheetOverlay({ className, ...props }: ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-chocolate/40",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

const sideClasses = {
  right:
    "inset-y-0 right-0 h-full w-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
  left: "inset-y-0 left-0 h-full w-full border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
  top: "inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
  bottom:
    "inset-x-0 bottom-0 h-auto rounded-t-surface border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
} as const;

type SheetContentProps = ComponentProps<typeof SheetPrimitive.Content> & {
  side?: keyof typeof sideClasses;
  closeLabel?: string;
};

/**
 * Sheet panel with overlay; needs a `SheetTitle` for its accessible name.
 * @param props Radix content props plus `side` and `closeLabel`, which adds a labelled close button.
 * @returns The sheet panel.
 */
function SheetContent({
  className,
  children,
  side = "right",
  closeLabel,
  ...props
}: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-4 border-border bg-card text-card-foreground transition ease-in-out",
          "data-[state=closed]:animate-out data-[state=closed]:duration-300",
          "data-[state=open]:animate-in data-[state=open]:duration-500",
          sideClasses[side],
          className,
        )}
        {...props}
      >
        {children}
        {closeLabel && (
          <SheetPrimitive.Close asChild>
            <Button variant="ghost" size="icon-sm" className="absolute top-3 right-3">
              <XIcon aria-hidden />
              <span className="sr-only">{closeLabel}</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}

/**
 * Title and description block at the top of the sheet.
 * @param props Native div props.
 * @returns The header element.
 */
function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4 pr-14", className)}
      {...props}
    />
  );
}

/**
 * Action row pinned to the bottom of the sheet.
 * @param props Native div props.
 * @returns The footer element.
 */
function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-3 p-4", className)}
      {...props}
    />
  );
}

/**
 * Sheet heading; also its accessible name.
 * @param props Radix title props.
 * @returns The title element.
 */
function SheetTitle({ className, ...props }: ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-display text-2xl leading-tight font-bold", className)}
      {...props}
    />
  );
}

/**
 * Supporting copy linked to the sheet with `aria-describedby`.
 * @param props Radix description props.
 * @returns The description element.
 */
function SheetDescription({
  className,
  ...props
}: ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
