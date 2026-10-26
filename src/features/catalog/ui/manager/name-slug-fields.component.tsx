"use client";

import { useTranslations } from "next-intl";
import type { UseFormRegisterReturn } from "react-hook-form";

import { Button } from "@/shared/ui/button";

import { TextField } from "./form-fields.component";

/**
 * Props for the name and slug fields.
 */
type NameSlugFieldsProps = {
  prefix: string;
  name: UseFormRegisterReturn;
  slug: UseFormRegisterReturn;
  isEditingSlug: boolean;
  onEditSlug: () => void;
  nameError: string | null;
  slugError: string | null;
};

/**
 * Names and stable generated slugs for catalog records.
 * @param props The id prefix, the registered name and slug fields, slug editing and errors.
 * @returns Name control and explicit slug editing.
 */
export function NameSlugFields({
  prefix,
  name,
  slug,
  isEditingSlug,
  onEditSlug,
  nameError,
  slugError,
}: NameSlugFieldsProps) {
  const translate = useTranslations("catalog.manager.fields");

  return (
    <>
      <TextField
        id={`${prefix}-name`}
        label={translate("name")}
        required
        error={nameError}
        {...name}
      />
      <div className="grid gap-2">
        <TextField
          id={`${prefix}-slug`}
          label={translate("slug")}
          hint={translate("slugHint")}
          required
          readOnly={!isEditingSlug}
          error={slugError}
          {...slug}
        />
        {!isEditingSlug && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-self-start"
            onClick={onEditSlug}
          >
            {translate("editSlug")}
          </Button>
        )}
      </div>
    </>
  );
}
