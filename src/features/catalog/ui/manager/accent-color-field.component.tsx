"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

import { TextField } from "./form-fields.component";
import { useAccentColorField } from "../../hooks/manager/use-accent-color-field.hook";

/**
 * Offers brand palette swatches alongside a custom picker and editable hex value.
 * @param props Initial accent and translated error.
 * @returns Accessible color controls submitting one accentColor value.
 */
export function AccentColorField({
  initialColor,
  error,
}: {
  initialColor: string;
  error: string | null;
}) {
  const translate = useTranslations("catalog.manager");
  const field = useAccentColorField(initialColor);

  return (
    <FieldSet className="gap-3">
      <FieldLegend variant="label" className="text-xs font-semibold">
        {translate("productForm.accentColor")}
      </FieldLegend>
      <div role="group" aria-label={translate("colors.palette")} className="flex gap-2">
        {field.palette.map((color) => (
          <Button
            key={color.key}
            type="button"
            variant="outline"
            size="icon"
            aria-label={translate(`colors.${color.key}`)}
            aria-pressed={field.color.toLowerCase() === color.value.toLowerCase()}
            className={`${color.className} aria-pressed:ring-2 aria-pressed:ring-foreground aria-pressed:ring-offset-2 aria-pressed:ring-offset-background`}
            onClick={() => field.setColor(color.value)}
          />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="product-custom-color" className="text-xs">
            {translate("colors.custom")}
          </FieldLabel>
          <Input
            id="product-custom-color"
            type="color"
            value={field.pickerColor}
            onChange={(event) => field.setColor(event.target.value)}
            className="h-10 w-24 p-1.5"
          />
        </Field>
        <TextField
          id="product-accent-color"
          name="accentColor"
          label={translate("colors.hex")}
          value={field.color}
          onChange={(event) => field.setColor(event.target.value)}
          error={error}
        />
      </div>
    </FieldSet>
  );
}
