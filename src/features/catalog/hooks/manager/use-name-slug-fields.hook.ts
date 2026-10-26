"use client";

import { useState } from "react";

import { CatalogSlug } from "../../domain/fields/catalog-slug.helper";

/**
 * Keeps existing slugs stable and generates new ones until explicitly edited.
 * @param initialName Initial name.
 * @param initialSlug Existing slug, or empty for automatic generation.
 * @returns Controlled fields and explicit edit handlers.
 */
export function useNameSlugFields(initialName: string, initialSlug: string) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [isAutomatic, setIsAutomatic] = useState(!initialSlug);

  function changeName(value: string) {
    setName(value);
    if (isAutomatic) setSlug(CatalogSlug.fromName(value));
  }

  function editSlug() {
    setIsAutomatic(false);
    setIsEditingSlug(true);
  }

  return { name, slug, isEditingSlug, changeName, setSlug, editSlug };
}
