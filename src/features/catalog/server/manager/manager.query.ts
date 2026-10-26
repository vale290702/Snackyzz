import "server-only";

import { requirePermission } from "@/features/access";
import { findCatalogImages } from "@/features/media";

import { managerRepository } from "./manager.repository";
import type { CatalogManagerData } from "./manager.types";
import { CatalogPermission } from "../mutation";

/**
 * Loads everything catalog management edits, archived rows included, for an admin with
 * `catalog.manage`.
 * @returns Brands, categories, products and variants, with logo and image URLs.
 * @throws Redirects to sign-in without a session, or answers 403 without the permission.
 */
export async function getCatalogManager(): Promise<CatalogManagerData> {
  const { client } = await requirePermission(CatalogPermission.Manage);

  const repository = managerRepository(client);
  const [brands, categories, products, variants] = await Promise.all([
    repository.listBrands(),
    repository.listCategories(),
    repository.listProducts(),
    repository.listVariants(),
  ]);

  const imageFileIds = [
    ...brands.map((brand) => brand.logoFileId),
    ...products.map((product) => product.imageFileId),
  ].filter((fileId) => fileId !== null);
  const images = await findCatalogImages([...new Set(imageFileIds)]);

  return {
    brands: brands.map((brand) => ({
      ...brand,
      logoUrl: brand.logoFileId ? (images.get(brand.logoFileId)?.url ?? null) : null,
    })),
    categories,
    products: products.map((product) => ({
      ...product,
      imageUrl: product.imageFileId ? (images.get(product.imageFileId)?.url ?? null) : null,
    })),
    variants,
  };
}
