"use client";

// shadcn/ui select. Local changes: trigger matches Input (paper, warm-line outline, control radius,
// 49px, 16px text, full width, deep-orange focus outline, warm-red invalid tint, legible disabled
// state, one size only); listbox is paper with a warm-line border and no shadow (only toasts float); items are
// 40px tall with a cream-tint highlight; popper positioning by default so the list never covers
// the trigger on phones; no dark mode. The `(--radix-…)` sizes are runtime values from Radix, not
// design values.

import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Select as SelectPrimitive } from "radix-ui";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";

/**
 * Single-choice dropdown; arrow keys, Enter and typeahead work out of the box.
 * @param props Radix select root props.
 * @returns The select root.
 */
function Select(props: ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

/**
 * Groups related items under a `SelectLabel`.
 * @param props Radix group props.
 * @returns The group element.
 */
function SelectGroup(props: ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

/**
 * Shows the selected item's text, or the placeholder.
 * @param props Radix value props.
 * @returns The value element.
 */
function SelectValue(props: ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

/**
 * Button that opens the list; label it like any other form control.
 * @param props Radix trigger props.
 * @returns The trigger button.
 */
function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-12.25 w-full items-center justify-between gap-2 rounded-control border border-input bg-paper px-3.5 py-3",
        "text-base whitespace-nowrap text-foreground transition-colors outline-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "aria-invalid:border-destructive aria-invalid:bg-destructive/5",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
        "data-[placeholder]:text-muted-foreground",
        "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

/**
 * Floating list of items, rendered in a portal.
 * @param props Radix content props; `position` defaults to `popper`.
 * @returns The list popover.
 */
function SelectContent({
  className,
  children,
  position = "popper",
  align = "start",
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "relative z-50 max-h-(--radix-select-content-available-height) min-w-32 origin-(--radix-select-content-transform-origin)",
          "overflow-x-hidden overflow-y-auto rounded-control border border-border bg-popover text-popover-foreground",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width) scroll-my-1",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

/**
 * Heading for a `SelectGroup`.
 * @param props Radix label props.
 * @returns The label element.
 */
function SelectLabel({ className, ...props }: ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("px-3 py-2 text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * One choice in the list.
 * @param props Radix item props; `value` is required.
 * @returns The item element.
 */
function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-10 w-full cursor-default items-center gap-2 rounded-control py-2 pr-9 pl-3 text-base outline-hidden select-none",
        "focus:bg-accent focus:text-accent-foreground data-[state=checked]:font-medium",
        "data-[disabled]:pointer-events-none data-[disabled]:text-muted-foreground",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "*:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span
        data-slot="select-item-indicator"
        className="absolute right-3 flex size-4 items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

/**
 * Divider between groups of items.
 * @param props Radix separator props.
 * @returns The separator element.
 */
function SelectSeparator({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

/**
 * Scroll affordance shown when the list overflows upward.
 * @param props Radix scroll button props.
 * @returns The scroll button.
 */
function SelectScrollUpButton({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

/**
 * Scroll affordance shown when the list overflows downward.
 * @param props Radix scroll button props.
 * @returns The scroll button.
 */
function SelectScrollDownButton({
  className,
  ...props
}: ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn("flex cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
