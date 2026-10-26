"use client";

import { useTranslations } from "next-intl";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { Checkbox } from "@/shared/ui/checkbox";
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/shared/ui/field";

import { TextField } from "./form-fields.component";
import type { useProductForm } from "../../hooks/manager/use-product-form.hook";

/**
 * Edits the first presentation alongside the product, using the parent form's state.
 * @param props Product form state and handlers.
 * @returns Presentation name, price, optional SKU and tracking fields.
 */
export function InlinePresentationFields({ form }: { form: ReturnType<typeof useProductForm> }) {
  const translate = useTranslations("catalog.manager");
  const errorMessage = useErrorMessage("catalog");
  const { values, fieldErrors, singleVariant } = form;

  return (
    <FieldSet className="gap-4">
      <FieldLegend variant="label">{translate("productForm.presentation")}</FieldLegend>
      <TextField
        id="product-presentation-name"
        name="presentationName"
        label={translate("productForm.presentationName")}
        required
        defaultValue={
          values.presentationName ??
          singleVariant?.name ??
          translate("productForm.defaultPresentationName")
        }
        error={errorMessage(fieldErrors.presentationName)}
      />
      <TextField
        id="product-price"
        name="price"
        type="number"
        min={1}
        step={1}
        inputMode="numeric"
        label={translate("variants.price")}
        required
        defaultValue={values.price ?? singleVariant?.price ?? ""}
        error={errorMessage(fieldErrors.price)}
      />
      <TextField
        id="product-sku"
        name="sku"
        label={translate("variants.sku")}
        defaultValue={values.sku ?? singleVariant?.sku ?? ""}
        error={errorMessage(fieldErrors.sku)}
      />
      <Field orientation="horizontal">
        <Checkbox
          id="product-stock-tracked"
          name="isStockTracked"
          checked={form.isStockTracked}
          onCheckedChange={(checked) => form.setIsStockTracked(checked === true)}
        />
        <FieldLabel htmlFor="product-stock-tracked" className="font-normal">
          {translate("variants.isStockTracked")}
        </FieldLabel>
      </Field>
    </FieldSet>
  );
}
