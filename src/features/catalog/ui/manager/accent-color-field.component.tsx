"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/cn";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

import { TextField } from "./form-fields.component";
import { useAccentColorField } from "../../hooks/manager/use-accent-color-field.hook";

/**
 * Offers brand palette swatches alongside a custom picker and editable hex value.
 * @param props The current accent, its change handler and translated error.
 * @returns Accessible color controls for one accent value.
 */
export function AccentColorField({
  color,
  onColorChange,
  error,
}: {
  color: string;
  onColorChange: (color: string) => void;
  error: string | null;
}) {
  const translate = useTranslations("catalog.manager");
  const field = useAccentColorField(color);

  return (
    <FieldSet className="gap-3">
      <FieldLegend variant="label" className="text-xs font-semibold">
        {translate("productForm.accentColor")}
      </FieldLegend>
      <RadioGroup
        aria-label={translate("colors.palette")}
        value={field.swatchValue}
        onValueChange={onColorChange}
        className="flex gap-2"
      >
        {field.palette.map((color) => (
          <RadioGroupItem
            key={color.key}
            value={color.value}
            aria-label={translate(`colors.${color.key}`)}
            className={cn("size-10 border-border", color.className)}
          />
        ))}
      </RadioGroup>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="product-custom-color" className="text-xs">
            {translate("colors.custom")}
          </FieldLabel>
          <Input
            id="product-custom-color"
            type="color"
            value={field.pickerColor}
            onChange={(event) => onColorChange(event.target.value)}
            className="h-10 w-24 p-1.5"
          />
        </Field>
        <TextField
          id="product-accent-color"
          label={translate("colors.hex")}
          value={color}
          onChange={(event) => onColorChange(event.target.value)}
          error={error}
        />
      </div>
    </FieldSet>
  );
}
