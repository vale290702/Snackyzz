"use client";

// shadcn/ui alert-dialog. Local changes: same paper panel, chocolate-tinted overlay, centering and
// Fraunces title as `dialog`; actions carry no button styles (callers pass `buttonVariants`); no
// dark mode.

import { AlertDialog as AlertDialogPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Modal confirmation root; it can't be dismissed by clicking outside.
 * @param props Radix alert-dialog root props.
 * @returns The alert dialog root.
 */
function AlertDialog(props: ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

/**
 * The confirmation panel with its overlay; needs a title and a description.
 * @param props Radix content props.
 * @returns The panel.
 */
function AlertDialogContent({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay
        data-slot="alert-dialog-overlay"
        className={cn(
          "fixed inset-0 z-50 bg-chocolate/40",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        )}
      />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "fixed inset-4 z-50 m-auto grid h-fit max-w-lg gap-6 overflow-y-auto rounded-surface bg-card p-6",
          "text-card-foreground duration-200 outline-none",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className,
        )}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  );
}

/**
 * Title and description block.
 * @param props Native div props.
 * @returns The header element.
 */
function AlertDialogHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-left", className)}
      {...props}
    />
  );
}

/**
 * Action row; stacks on phones with the primary action on top.
 * @param props Native div props.
 * @returns The footer element.
 */
function AlertDialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn("flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

/**
 * The question being confirmed; also the dialog's accessible name.
 * @param props Radix title props.
 * @returns The title element.
 */
function AlertDialogTitle({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("font-display text-2xl leading-tight font-bold", className)}
      {...props}
    />
  );
}

/**
 * What confirming does.
 * @param props Radix description props.
 * @returns The description element.
 */
function AlertDialogDescription({
  className,
  ...props
}: ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-base text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * Confirms and closes; style it with `buttonVariants`.
 * @param props Radix action props.
 * @returns The action element.
 */
function AlertDialogAction(props: ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return <AlertDialogPrimitive.Action data-slot="alert-dialog-action" {...props} />;
}

/**
 * Cancels and closes; gets focus when the dialog opens. Style it with `buttonVariants`.
 * @param props Radix cancel props.
 * @returns The cancel element.
 */
function AlertDialogCancel(props: ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" {...props} />;
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
};
