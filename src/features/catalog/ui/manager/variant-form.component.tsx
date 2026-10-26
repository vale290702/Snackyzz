"use client";

import { useTranslations } from "next-intl";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { Button } from "@/shared/ui/button";
import { FieldGroup } from "@/shared/ui/field";

import { FormAlert, SaveButton, TextField } from "./form-fields.component";
import { StockTrackedField } from "./stock-tracked-field.component";
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
  onDirtyChange?: ((isDirty: boolean) => void) | undefined;
};

/**
 * Adds a variant to the product, or edits the one passed in.
 * @param props The product, the variant being edited (null for a new one), the save and cancel
 * handlers, and who to tell about unsaved changes.
 * @returns The form.
 */
export function VariantForm({
  productId,
  variant,
  onSaved,
  onCancel,
  onDirtyChange,
}: VariantFormProps) {
  const variantForm = useVariantForm({
    productId,
    variant,
    onSaved,
    onDirtyChange,
  });
  const { form, submit, isSubmitting, fieldErrors, formError } = variantForm;
  const translate = useTranslations("catalog.manager");
  const errorMessage = useErrorMessage("catalog");

  return (
    <form
      onSubmit={submit}
      aria-busy={isSubmitting}
      aria-labelledby="variant-editor-title"
      className="grid gap-5 rounded-control border border-border bg-background p-4.5"
    >
      <h4 id="variant-editor-title" className="text-base font-bold">
        {variant ? translate("variants.editTitle") : translate("variants.createTitle")}
      </h4>
      <FieldGroup className="gap-4.5">
        <TextField
          id="variant-name"
          label={translate("fields.name")}
          required
          error={errorMessage(fieldErrors.name)}
          {...form.register("name")}
        />
        <TextField
          id="variant-price"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          label={translate("variants.price")}
          required
          error={errorMessage(fieldErrors.price)}
          {...form.register("price")}
        />
        <TextField
          id="variant-sku"
          label={translate("variants.sku")}
          error={errorMessage(fieldErrors.sku)}
          {...form.register("sku")}
        />
        <StockTrackedField
          id="variant-stock-tracked"
          checked={variantForm.isStockTracked}
          onCheckedChange={variantForm.setIsStockTracked}
        />
      </FieldGroup>
      <FormAlert message={errorMessage(formError)} />
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="text-sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {translate("actions.cancel")}
        </Button>
        <SaveButton
          isPending={isSubmitting}
          disabled={isSubmitting}
          label={translate("variants.submit")}
          pendingLabel={translate("actions.saving")}
        />
      </div>
    </form>
  );
}
