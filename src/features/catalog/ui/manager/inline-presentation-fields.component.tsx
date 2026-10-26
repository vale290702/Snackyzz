"use client";

import { useTranslations } from "next-intl";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { FieldLegend, FieldSet } from "@/shared/ui/field";

import { TextField } from "./form-fields.component";
import { StockTrackedField } from "./stock-tracked-field.component";
import type { useProductForm } from "../../hooks/manager/use-product-form.hook";

/**
 * Edits the first presentation alongside the product, using the parent form's state.
 * @param props Product form state and handlers.
 * @returns Presentation name, price, optional SKU and tracking fields.
 */
export function InlinePresentationFields({ form }: { form: ReturnType<typeof useProductForm> }) {
  const translate = useTranslations("catalog.manager");
  const errorMessage = useErrorMessage("catalog");
  const { form: fields, fieldErrors } = form;

  return (
    <FieldSet className="gap-4">
      <FieldLegend variant="label">{translate("productForm.presentation")}</FieldLegend>
      <TextField
        id="product-presentation-name"
        label={translate("productForm.presentationName")}
        required
        error={errorMessage(fieldErrors.presentationName)}
        {...fields.register("presentationName")}
      />
      <TextField
        id="product-price"
        type="number"
        min={1}
        step={1}
        inputMode="numeric"
        label={translate("variants.price")}
        required
        error={errorMessage(fieldErrors.price)}
        {...fields.register("price")}
      />
      <TextField
        id="product-sku"
        label={translate("variants.sku")}
        error={errorMessage(fieldErrors.sku)}
        {...fields.register("sku")}
      />
      <StockTrackedField
        id="product-stock-tracked"
        checked={form.isStockTracked}
        onCheckedChange={form.setIsStockTracked}
      />
    </FieldSet>
  );
}
