"use client";

import { useFormAction } from "@/shared/lib/form-action";

import { useCatalogImageUpload } from "./use-catalog-image-upload.hook";
import { brandInputSchema } from "../../domain/brands";
import { CatalogFieldError } from "../../domain/fields";
import { CatalogImagePurpose } from "../../domain/images";
import type { Brand, ManagedBrand } from "../../index";
import { createBrandAction, updateBrandAction } from "../../server/brands/brands.actions";

/**
 * Props the brand form's hook needs.
 */
type BrandFormOptions = {
  brand: ManagedBrand | null;
  onSaved: (brand: Brand) => void;
};

/**
 * State for the brand editor: creates a brand, or replaces the one being edited, with its logo.
 * @param options The brand being edited (null for a new one) and what to do once it is saved.
 * @returns The form action and codes, the logo upload, and whether the form can be submitted.
 */
export function useBrandForm({ brand, onSaved }: BrandFormOptions) {
  const logo = useCatalogImageUpload(CatalogImagePurpose.BrandLogo, {
    fileId: brand?.logoFileId ?? null,
    previewUrl: brand?.logoUrl ?? null,
  });

  const form = useFormAction({
    schema: brandInputSchema,
    action: async (input) => {
      const result = brand
        ? await updateBrandAction({ ...input, id: brand.id })
        : await createBrandAction(input);
      if (result.ok) {
        onSaved(result.value);
      }

      return result;
    },
    fieldErrorCodes: Object.values(CatalogFieldError),
    preserve: ["slug", "name", "tagline", "description", "label", "sortOrder"],
  });

  return { ...form, logo, canSubmit: !form.isPending && !logo.isUploading };
}
