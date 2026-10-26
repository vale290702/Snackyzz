"use client";

import { useServerForm } from "@/shared/lib/server-form";

import { useCatalogImageUpload } from "./use-catalog-image-upload.hook";
import { useNameSlugFields } from "./use-name-slug-fields.hook";
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
  onDirtyChange?: ((isDirty: boolean) => void) | undefined;
};

/**
 * State for the brand editor: creates a brand, or replaces the one being edited, with its logo.
 * @param options The brand being edited (null for a new one), what to do once it is saved, and who
 * to tell about unsaved changes.
 * @returns The form, its submit handler and error codes, the name and slug handlers, the logo
 * upload, and whether the form can be submitted.
 */
export function useBrandForm({ brand, onSaved, onDirtyChange }: BrandFormOptions) {
  const server = useServerForm({
    schema: brandInputSchema,
    values: {
      name: brand?.name ?? "",
      slug: brand?.slug ?? "",
      tagline: brand?.tagline ?? "",
      description: brand?.description ?? "",
      label: brand?.label ?? "",
      logoFileId: brand?.logoFileId ?? null,
      sortOrder: brand?.sortOrder ?? 0,
    },
    action: (input) =>
      brand ? updateBrandAction({ ...input, id: brand.id }) : createBrandAction(input),
    fieldErrorCodes: Object.values(CatalogFieldError),
    onSuccess: onSaved,
    onDirtyChange,
  });
  const { setValue } = server.form;
  const nameSlug = useNameSlugFields({
    initialSlug: brand?.slug ?? "",
    setSlug: (slug) => setValue("slug", slug, { shouldDirty: true }),
  });
  const logo = useCatalogImageUpload(
    CatalogImagePurpose.BrandLogo,
    { fileId: brand?.logoFileId ?? null, previewUrl: brand?.logoUrl ?? null },
    (fileId) => setValue("logoFileId", fileId, { shouldDirty: true }),
  );

  return { ...server, nameSlug, logo, canSubmit: !server.isSubmitting && !logo.isUploading };
}
