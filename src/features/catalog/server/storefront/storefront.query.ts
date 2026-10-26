import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { findCatalogImages } from "@/features/media";
import { createAnonClient } from "@/integrations/supabase/anon-client";

import { StorefrontAssembly } from "./storefront-assembly.helper";
import { storefrontRepository } from "./storefront.repository";
import type { StorefrontCatalog } from "./storefront.types";
import { CatalogFields } from "../../domain/fields";
import { CATALOG_CACHE_TAG } from "../mutation";

const EMPTY_CATALOG: StorefrontCatalog = { brands: [], categories: [], products: [] };

/**
 * Lists what the storefront sells, cached until an admin changes the catalog.
 * @param brandSlug A brand page's slug, from the URL; omit it for the whole shop.
 * @returns Brands, categories and products on sale; empty for a slug no active brand has.
 * @throws When the database request fails.
 */
export async function listStorefrontCatalog(brandSlug?: string): Promise<StorefrontCatalog> {
  if (brandSlug === undefined) {
    return loadStorefrontCatalog(null);
  }

  // Only well-formed slugs reach the cache key, so arbitrary URLs can't fill the cache.
  const parsed = CatalogFields.slug.safeParse(brandSlug);
  if (!parsed.success) {
    return EMPTY_CATALOG;
  }

  return loadStorefrontCatalog(parsed.data);
}

async function loadStorefrontCatalog(brandSlug: string | null): Promise<StorefrontCatalog> {
  "use cache";
  cacheTag(CATALOG_CACHE_TAG);
  cacheLife("max");

  const repository = storefrontRepository(createAnonClient());
  const [brands, categories, products] = await Promise.all([
    repository.listBrands(),
    repository.listCategories(),
    repository.listProducts(),
  ]);

  const images = await findCatalogImages(StorefrontAssembly.imageFileIds({ brands, products }));

  return StorefrontAssembly.build({ brands, categories, products }, images, brandSlug);
}
