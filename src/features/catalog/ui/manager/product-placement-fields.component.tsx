"use client";

import { useTranslations } from "next-intl";

import { Checkbox } from "@/shared/ui/checkbox";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/shared/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

import type { Category, ManagedBrand } from "../../index";

/**
 * Props for the product's brand select.
 */
type BrandSelectFieldProps = {
  options: readonly ManagedBrand[];
  brandId: string;
  onChange: (brandId: string) => void;
  error: string | null;
};

/**
 * The brand whose shelf shows the product; submitted as `brandId`.
 * @param props The brands to offer, the chosen one, its handler and error.
 * @returns The field.
 */
export function BrandSelectField({ options, brandId, onChange, error }: BrandSelectFieldProps) {
  const translate = useTranslations("catalog.manager.productForm");

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor="product-brand" className="text-xs font-semibold">
        {translate("brand")}
      </FieldLabel>
      <Select name="brandId" value={brandId} onValueChange={onChange}>
        <SelectTrigger id="product-brand" aria-invalid={Boolean(error)} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((brand) => (
            <SelectItem key={brand.id} value={brand.id}>
              {brand.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError>{error}</FieldError>
    </Field>
  );
}

/**
 * Props for the product's category checkboxes.
 */
type CategoryCheckboxesProps = {
  options: readonly Category[];
  categoryIds: readonly string[];
  onToggle: (categoryId: string, isSelected: boolean) => void;
  error: string | null;
};

/**
 * The categories the product belongs to; each checked one is submitted as `categoryIds`.
 * @param props The categories to offer, the chosen ones, the toggle handler and error.
 * @returns The fieldset, or null when there are no categories.
 */
export function CategoryCheckboxes({
  options,
  categoryIds,
  onToggle,
  error,
}: CategoryCheckboxesProps) {
  const translate = useTranslations("catalog.manager.productForm");
  if (options.length === 0) {
    return null;
  }

  return (
    <FieldSet data-invalid={Boolean(error)} className="gap-3">
      <FieldLegend variant="label" className="text-xs font-semibold">
        {translate("categories")}
      </FieldLegend>
      {options.map((category) => (
        <Field key={category.id} orientation="horizontal">
          <Checkbox
            id={`product-category-${category.id}`}
            name="categoryIds"
            value={category.id}
            checked={categoryIds.includes(category.id)}
            onCheckedChange={(checked) => onToggle(category.id, checked === true)}
          />
          <FieldLabel htmlFor={`product-category-${category.id}`} className="font-normal">
            {category.name}
          </FieldLabel>
        </Field>
      ))}
      <FieldError>{error}</FieldError>
    </FieldSet>
  );
}
