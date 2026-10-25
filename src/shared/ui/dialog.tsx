"use client";

// shadcn/ui dialog. Local changes: paper panel with surface radius, flat (no border, no shadow),
// chocolate-tinted overlay instead of black, centered with inset + auto margins + fit height
// (instead of arbitrary calc/translate values) so tall content scrolls inside the viewport, Fraunces title, close button is an icon Button that renders only when the
// caller passes `closeLabel` (no built-in English text), DialogFooter's built-in close button
// removed for the same reason, no dark mode.

import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

/**
 * Modal dialog root; traps focus while open and closes on Escape.
 * @param props Radix dialog root props.
 * @returns The dialog root.
 */
function Dialog(props: ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

/**
 * Element that opens the dialog; use `asChild` with a `Button`.
 * @param props Radix trigger props.
 * @returns The trigger element.
 */
function DialogTrigger(props: ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

/**
 * Portal that renders dialog parts at the end of the body.
 * @param props Radix portal props.
 * @returns The portal.
 */
function DialogPortal(props: ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

/**
 * Element that closes the dialog; use `asChild` with a `Button`.
 * @param props Radix close props.
 * @returns The close element.
 */
function DialogClose(props: ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

/**
 * Dimmed backdrop behind the dialog.
 * @param props Radix overlay props.
 * @returns The overlay element.
 */
function DialogOverlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
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

type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  closeLabel?: string;
};

/**
 * Dialog panel with overlay; needs a `DialogTitle` for its accessible name.
 * @param props Radix content props plus `closeLabel`, which adds a labelled close button.
 * @returns The dialog panel.
 */
function DialogContent({ className, children, closeLabel, ...props }: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed inset-4 z-50 m-auto grid h-fit max-w-lg gap-6 overflow-y-auto rounded-surface bg-card p-6",
          "text-card-foreground duration-200 outline-none",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className,
        )}
        {...props}
      >
        {children}
        {closeLabel && (
          <DialogPrimitive.Close asChild>
            <Button variant="ghost" size="icon-sm" className="absolute top-3 right-3">
              <XIcon aria-hidden />
              <span className="sr-only">{closeLabel}</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

/**
 * Title and description block at the top of the dialog.
 * @param props Native div props.
 * @returns The header element.
 */
function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 pr-10 text-left", className)}
      {...props}
    />
  );
}

/**
 * Action row; stacks on phones with the primary action on top.
 * @param props Native div props.
 * @returns The footer element.
 */
function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn("flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

/**
 * Dialog heading; also its accessible name.
 * @param props Radix title props.
 * @returns The title element.
 */
function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("font-display text-2xl leading-tight font-bold", className)}
      {...props}
    />
  );
}

/**
 * Supporting copy linked to the dialog with `aria-describedby`.
 * @param props Radix description props.
 * @returns The description element.
 */
function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-base text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
