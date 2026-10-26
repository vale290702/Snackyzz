"use client";

import { useTranslations } from "next-intl";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field";

import { FormAlert, SaveButton, TextField } from "./form-fields.component";
import { useVariantForm } from "../../hooks/manager/use-variant-form.hook";
import type { Variant } from "../../index";

/**
 * Props for the variant form.
 */
type VariantFormProps = {
  productId: string;
  variant: Variant | null;
  onSaved: () => void;
  onCancel: () => void;
};

/**
 * Adds a variant to the product, or edits the one passed in.
 * @param props The product, the variant being edited (null for a new one), and the save and cancel
 * handlers.
 * @returns The form.
 */
export function VariantForm({ productId, variant, onSaved, onCancel }: VariantFormProps) {
  const {
    formAction,
    isPending,
    values,
    fieldErrors,
    formError,
    isStockTracked,
    setIsStockTracked,
  } = useVariantForm({ productId, variant, onSaved });
  const translate = useTranslations("catalog.manager");
  const errorMessage = useErrorMessage("catalog");

  return (
    <form
      action={formAction}
      aria-busy={isPending}
      aria-labelledby="variant-editor-title"
      className="grid gap-5 rounded-control border border-border bg-background p-4.5"
    >
      <h4 id="variant-editor-title" className="text-base font-bold">
        {variant ? translate("variants.editTitle") : translate("variants.createTitle")}
      </h4>
      <FieldGroup className="gap-4.5">
        <TextField
          id="variant-name"
          name="name"
          label={translate("fields.name")}
          required
          defaultValue={values.name ?? variant?.name ?? ""}
          error={errorMessage(fieldErrors.name)}
        />
        <TextField
          id="variant-price"
          name="price"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          label={translate("variants.price")}
          required
          defaultValue={values.price ?? variant?.price ?? ""}
          error={errorMessage(fieldErrors.price)}
        />
        <TextField
          id="variant-sku"
          name="sku"
          label={translate("variants.sku")}
          defaultValue={values.sku ?? variant?.sku ?? ""}
          error={errorMessage(fieldErrors.sku)}
        />
        <input type="hidden" name="sortOrder" value={values.sortOrder ?? variant?.sortOrder ?? 0} />
        <Field orientation="horizontal">
          <Checkbox
            id="variant-stock-tracked"
            name="isStockTracked"
            checked={isStockTracked}
            onCheckedChange={(checked) => setIsStockTracked(checked === true)}
          />
          <FieldLabel htmlFor="variant-stock-tracked" className="font-normal">
            {translate("variants.isStockTracked")}
          </FieldLabel>
        </Field>
      </FieldGroup>
      <FormAlert message={errorMessage(formError)} />
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Button type="button" variant="outline" className="text-sm" onClick={onCancel}>
          {translate("actions.cancel")}
        </Button>
        <SaveButton
          isPending={isPending}
          disabled={isPending}
          label={translate("variants.submit")}
          pendingLabel={translate("actions.saving")}
        />
      </div>
    </form>
  );
}
