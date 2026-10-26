"use client";

import { useTranslations } from "next-intl";

import { Field, FieldLabel, FieldLegend, FieldSet } from "@/shared/ui/field";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

import { ProductPrice } from "./product-price.component";
import type { VariantDto } from "../../index";

/**
 * Props for the variant picker.
 */
type VariantPickerProps = {
  productId: string;
  variants: VariantDto[];
  selectedId: string;
  onSelect: (variantId: string) => void;
};

/**
 * Radio cards for choosing how to buy a product, each with its price.
 * @param props The product's variants, the selected one, and the selection handler.
 * @returns The picker fieldset.
 */
export function VariantPicker({ productId, variants, selectedId, onSelect }: VariantPickerProps) {
  const translate = useTranslations("catalog.product");

  return (
    <FieldSet className="mb-5 gap-3">
      <FieldLegend variant="label" className="mb-0">
        {translate("variantLegend")}
      </FieldLegend>
      <RadioGroup value={selectedId} onValueChange={onSelect} className="gap-2">
        {variants.map((variant) => (
          <VariantOption key={variant.id} productId={productId} variant={variant} />
        ))}
      </RadioGroup>
    </FieldSet>
  );
}

function VariantOption({ productId, variant }: { productId: string; variant: VariantDto }) {
  const optionId = `variant-${productId}-${variant.id}`;

  return (
    <FieldLabel htmlFor={optionId}>
      <Field orientation="horizontal" className="gap-3 p-4">
        <RadioGroupItem value={variant.id} id={optionId} />
        <span className="flex-1 text-base">{variant.name}</span>
        <ProductPrice amount={variant.price} className="text-sm font-semibold tabular-nums" />
      </Field>
    </FieldLabel>
  );
}
