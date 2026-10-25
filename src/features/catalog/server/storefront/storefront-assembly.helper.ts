import type { CatalogImage } from "@/features/media";

import type {
  BrandDto,
  ProductDto,
  StorefrontBrandRow,
  StorefrontCatalog,
  StorefrontProductRow,
  StorefrontRows,
} from "./storefront.types";

/**
 * Pure assembly of the storefront catalog from what shoppers may read.
 */
export class StorefrontAssembly {
  private constructor() {}

  /**
   * Builds the catalog: products of listed brands that have a default variant, with image URLs.
   * @param rows Active brands, categories and products in display order.
   * @param images Catalog images keyed by file id; a missing image renders as none.
   * @param brandSlug Only this brand and its products, or null for every brand.
   * @returns The storefront catalog, products grouped by brand in brand order.
   */
  static build(
    rows: StorefrontRows,
    images: ReadonlyMap<string, CatalogImage>,
    brandSlug: string | null,
  ): StorefrontCatalog {
    const brands = rows.brands.filter((brand) => brandSlug === null || brand.slug === brandSlug);
    const brandOrder = new Map(brands.map((brand, position) => [brand.id, position]));

    const products = rows.products
      .filter((product) => brandOrder.has(product.brandId))
      .filter((product) => product.variants.some((variant) => variant.isDefault))
      .sort((first, second) => {
        return (brandOrder.get(first.brandId) ?? 0) - (brandOrder.get(second.brandId) ?? 0);
      });

    return {
      brands: brands.map((brand) => StorefrontAssembly.toBrandDto(brand, images)),
      categories: rows.categories,
      products: products.map((product) => StorefrontAssembly.toProductDto(product, images)),
    };
  }

  /**
   * Lists every image file the rows refer to.
   * @param rows Active brands and products.
   * @returns Distinct file ids of logos and product images.
   */
  static imageFileIds(rows: Pick<StorefrontRows, "brands" | "products">): string[] {
    const logoIds = rows.brands.map((brand) => brand.logoFileId);
    const imageIds = rows.products.map((product) => product.imageFileId);
    const fileIds = [...logoIds, ...imageIds].filter((fileId) => fileId !== null);

    return [...new Set(fileIds)];
  }

  private static toBrandDto(
    { logoFileId, ...brand }: StorefrontBrandRow,
    images: ReadonlyMap<string, CatalogImage>,
  ): BrandDto {
    return { ...brand, logoUrl: StorefrontAssembly.imageUrl(logoFileId, images) };
  }

  private static toProductDto(
    { imageFileId, ...product }: StorefrontProductRow,
    images: ReadonlyMap<string, CatalogImage>,
  ): ProductDto {
    return { ...product, imageUrl: StorefrontAssembly.imageUrl(imageFileId, images) };
  }

  private static imageUrl(
    fileId: string | null,
    images: ReadonlyMap<string, CatalogImage>,
  ): string | null {
    if (fileId === null) {
      return null;
    }

    return images.get(fileId)?.url ?? null;
  }
}
