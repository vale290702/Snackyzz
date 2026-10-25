"use client";

// shadcn/ui field. Local changes: tighter 8px label-to-control gap and 24px between fields,
// selected choice cards (FieldLabel wrapping a Field) layer on cream tint with a chocolate outline,
// disabled fields dim to 70% instead of 50%, FieldError dedupes messages with a Set and keys
// list items by message, no dark mode.

import { cva, type VariantProps } from "class-variance-authority";
import { useMemo, type ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";
import { Label } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";

/**
 * Fieldset that groups related fields under one legend.
 * @param props Native fieldset props.
 * @returns The fieldset element.
 */
function FieldSet({ className, ...props }: ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "flex flex-col gap-6",
        "has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Legend for a `FieldSet`, as a section heading or as a field label.
 * @param props Native legend props plus `variant`.
 * @returns The legend element.
 */
function FieldLegend({
  className,
  variant = "legend",
  ...props
}: ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-3 font-medium",
        "data-[variant=label]:text-sm data-[variant=legend]:text-base",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Vertical stack of fields; also the container-query root for responsive fields.
 * @param props Native div props.
 * @returns The group element.
 */
function FieldGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-6",
        "data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4",
        className,
      )}
      {...props}
    />
  );
}

const fieldVariants = cva("group/field flex w-full gap-2 data-[invalid=true]:text-destructive", {
  variants: {
    orientation: {
      vertical: ["flex-col [&>*]:w-full [&>.sr-only]:w-auto"],
      horizontal: [
        "flex-row items-center gap-3",
        "[&>[data-slot=field-label]]:flex-auto",
        "has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      ],
      responsive: [
        "flex-col @md/field-group:flex-row @md/field-group:items-center [&>*]:w-full @md/field-group:[&>*]:w-auto [&>.sr-only]:w-auto",
        "@md/field-group:[&>[data-slot=field-label]]:flex-auto",
        "@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      ],
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

/**
 * One form field: label, control, description and error laid out together.
 * @param props Native div props plus `orientation`; set `data-invalid` to tint the field.
 * @returns The field group element.
 */
function Field({
  className,
  orientation = "vertical",
  ...props
}: ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

/**
 * Column that holds a label and its description next to a checkbox or radio.
 * @param props Native div props.
 * @returns The content element.
 */
function FieldContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn("group/field-content flex flex-1 flex-col gap-1.5 leading-snug", className)}
      {...props}
    />
  );
}

/**
 * Label for a field; wrapping a `Field` turns it into a selectable choice card.
 * @param props Label props; pair `htmlFor` with the control's `id`.
 * @returns The label element.
 */
function FieldLabel({ className, ...props }: ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-70",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-control",
        "has-[>[data-slot=field]]:border has-[>[data-slot=field]]:bg-paper [&>*]:data-[slot=field]:p-4",
        "has-data-[state=checked]:border-secondary has-data-[state=checked]:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Title-styled text for a field that is not tied to one control.
 * @param props Native div props.
 * @returns The title element.
 */
function FieldTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-70",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Helper text under a field; link it with `aria-describedby`.
 * @param props Native paragraph props.
 * @returns The description element.
 */
function FieldDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        "text-sm leading-normal font-normal text-muted-foreground group-has-[[data-orientation=horizontal]]/field:text-balance",
        "last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5",
        "[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-orange-deep",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Divider between field groups, with optional centered text.
 * @param props Native div props; children render on top of the line.
 * @returns The separator element.
 */
function FieldSeparator({ children, className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",
        className,
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

type FieldErrorProps = ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>;
};

/**
 * Error text for a field, announced as an alert; renders nothing without content.
 * @param props Native div props plus `errors`, a list of already translated messages.
 * @returns The error element, or null when there is nothing to show.
 */
function FieldError({ className, children, errors, ...props }: FieldErrorProps) {
  const content = useMemo(() => {
    if (children) {
      return children;
    }

    const messages = [...new Set(errors?.map((error) => error?.message).filter(Boolean))];
    if (messages.length <= 1) {
      return messages[0];
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {content}
    </div>
  );
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
};
