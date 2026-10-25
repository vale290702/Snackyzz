"use client";

// shadcn/ui sonner (Toast). Local changes: always light (no next-themes, no dark mode), sonner's
// built-in styles turned off and replaced with tokens: paper surface, warm-line border, surface
// radius and the soft chocolate `shadow-float` (the only shadow DESIGN.md allows); status icons use
// the leaf, honey and warm-red inks; action buttons reuse buttonVariants; `containerAriaLabel` is
// required because sonner's default label is English; `toast` is re-exported so features import
// one module.

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, toast, type ToasterProps as SonnerProps } from "sonner";

import { buttonVariants } from "@/shared/ui/button";

type ToasterProps = Omit<SonnerProps, "theme"> & {
  containerAriaLabel: string;
};

const toastClassNames = {
  toast:
    "flex w-full items-start gap-3 rounded-surface border border-border bg-paper p-4 text-foreground shadow-float",
  content: "flex flex-1 flex-col gap-1",
  title: "text-sm font-semibold",
  description: "text-sm text-muted-foreground",
  icon: "mt-0.5 shrink-0",
  success: "[&_[data-icon]]:text-leaf",
  warning: "[&_[data-icon]]:text-honey",
  error: "[&_[data-icon]]:text-destructive",
  actionButton: buttonVariants({ variant: "dark", size: "sm" }),
  cancelButton: buttonVariants({ variant: "ghost", size: "sm" }),
};

/**
 * Toast outlet; mount once in a layout and show toasts with `toast()`.
 * @param props Sonner toaster props; `containerAriaLabel` names the notification region.
 * @returns The toaster region.
 */
function Toaster({ toastOptions, ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: toastClassNames,
        ...toastOptions,
      }}
      {...props}
    />
  );
}

export { Toaster, toast };
