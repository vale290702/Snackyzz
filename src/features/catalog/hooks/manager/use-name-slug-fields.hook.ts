"use client";

import { useState, type ChangeEvent } from "react";

import { CatalogSlug } from "../../domain/fields/catalog-slug.helper";

/**
 * Options for the name and slug fields.
 */
type NameSlugFieldsOptions = {
  initialSlug: string;
  setSlug: (slug: string) => void;
};

/**
 * Keeps existing slugs stable and generates new ones from the name until explicitly edited.
 * @param options The record's slug (empty for a new record) and how to set the form's slug.
 * @returns Whether the slug is being edited, the edit handler, and the name's change handler.
 */
export function useNameSlugFields({ initialSlug, setSlug }: NameSlugFieldsOptions) {
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const isAutomatic = !initialSlug && !isEditingSlug;

  const nameChanged = (event: ChangeEvent<HTMLInputElement>) => {
    if (isAutomatic) {
      setSlug(CatalogSlug.fromName(event.target.value));
    }
  };

  return { isEditingSlug, editSlug: () => setIsEditingSlug(true), nameChanged };
}
