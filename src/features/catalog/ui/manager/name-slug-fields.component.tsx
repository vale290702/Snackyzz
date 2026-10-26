"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";

import { TextField } from "./form-fields.component";
import { useNameSlugFields } from "../../hooks/manager/use-name-slug-fields.hook";

/**
 * Names and stable generated slugs for catalog records.
 * @param props Initial values, record prefix and translated field errors.
 * @returns Name control and explicit slug editing.
 */
export function NameSlugFields({
  prefix,
  name,
  slug,
  nameError,
  slugError,
}: {
  prefix: string;
  name: string;
  slug: string;
  nameError: string | null;
  slugError: string | null;
}) {
  const fields = useNameSlugFields(name, slug);
  const translate = useTranslations("catalog.manager.fields");

  return (
    <>
      <TextField
        id={`${prefix}-name`}
        name="name"
        label={translate("name")}
        required
        value={fields.name}
        onChange={(event) => fields.changeName(event.target.value)}
        error={nameError}
      />
      <div className="grid gap-2">
        <TextField
          id={`${prefix}-slug`}
          name="slug"
          label={translate("slug")}
          hint={translate("slugHint")}
          required
          value={fields.slug}
          readOnly={!fields.isEditingSlug}
          onChange={(event) => fields.setSlug(event.target.value)}
          error={slugError}
        />
        {!fields.isEditingSlug && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-self-start"
            onClick={fields.editSlug}
          >
            {translate("editSlug")}
          </Button>
        )}
      </div>
    </>
  );
}
