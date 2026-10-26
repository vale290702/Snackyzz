"use client";

import { useTranslations } from "next-intl";

import { Checkbox } from "@/shared/ui/checkbox";
import { Field, FieldLabel } from "@/shared/ui/field";

/**
 * Props for the stock-tracking checkbox.
 */
type StockTrackedFieldProps = {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

/**
 * Whether selling a presentation takes units from stock.
 * @param props The checkbox's id, whether it is checked and its change handler.
 * @returns The labelled checkbox.
 */
export function StockTrackedField({ id, checked, onCheckedChange }: StockTrackedFieldProps) {
  const translate = useTranslations("catalog.manager.variants");

  return (
    <Field orientation="horizontal">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(state) => onCheckedChange(state === true)}
      />
      <FieldLabel htmlFor={id} className="font-normal">
        {translate("isStockTracked")}
      </FieldLabel>
    </Field>
  );
}
