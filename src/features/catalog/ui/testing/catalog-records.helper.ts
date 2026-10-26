import type {
  BrandDto,
  Category,
  ManagedBrand,
  ManagedProduct,
  ProductDto,
  Variant,
  VariantDto,
} from "../../index";

/**
 * Catalog records for hook and component tests; each builder takes overrides.
 */
export class CatalogRecords {
  private constructor() {}

  /**
   * A storefront brand.
   * @param overrides Fields to change.
   * @returns The brand DTO.
   */
  static brandDto(overrides: Partial<BrandDto> = {}): BrandDto {
    return {
      id: "brand-snackyzz",
      slug: "snackyzz",
      name: "Snackyzz",
      tagline: "Cookies para pausas pequeñas.",
      description: "Galletas horneadas en Costa Rica.",
      label: "Snackyzz",
      isPrimary: true,
      logoUrl: null,
      ...overrides,
    };
  }

  /**
   * A storefront variant.
   * @param overrides Fields to change.
   * @returns The variant DTO.
   */
  static variantDto(overrides: Partial<VariantDto> = {}): VariantDto {
    return {
      id: "variant-unit",
      sku: null,
      name: "Unidad",
      price: 2500,
      isDefault: true,
      isStockTracked: true,
      ...overrides,
    };
  }

  /**
   * A storefront product with one default variant.
   * @param overrides Fields to change.
   * @returns The product DTO.
   */
  static productDto(overrides: Partial<ProductDto> = {}): ProductDto {
    return {
      id: "product-choco",
      brandId: "brand-snackyzz",
      slug: "choco-cloud",
      name: "Choco Cloud",
      description: "Suave por dentro y crujiente por fuera.",
      badge: "La clásica",
      accentColor: "#ED781A",
      imageUrl: "https://example.test/choco-cloud.webp",
      categoryIds: [],
      variants: [CatalogRecords.variantDto()],
      ...overrides,
    };
  }

  /**
   * An admin brand.
   * @param overrides Fields to change.
   * @returns The managed brand.
   */
  static brand(overrides: Partial<ManagedBrand> = {}): ManagedBrand {
    return {
      id: "00000000-0000-7000-8000-0000000000b1",
      slug: "snackyzz",
      name: "Snackyzz",
      tagline: null,
      description: null,
      label: null,
      isPrimary: true,
      logoFileId: null,
      logoUrl: null,
      sortOrder: 0,
      archivedAt: null,
      ...overrides,
    };
  }

  /**
   * An admin category.
   * @param overrides Fields to change.
   * @returns The category.
   */
  static category(overrides: Partial<Category> = {}): Category {
    return {
      id: "00000000-0000-7000-8000-0000000000c1",
      slug: "clasicas",
      name: "Clásicas",
      sortOrder: 0,
      archivedAt: null,
      ...overrides,
    };
  }

  /**
   * An admin product.
   * @param overrides Fields to change.
   * @returns The managed product.
   */
  static product(overrides: Partial<ManagedProduct> = {}): ManagedProduct {
    return {
      id: "00000000-0000-7000-8000-0000000000d1",
      brandId: "00000000-0000-7000-8000-0000000000b1",
      slug: "choco-cloud",
      name: "Choco Cloud",
      description: "Suave por dentro.",
      badge: null,
      accentColor: "#ED781A",
      imageFileId: null,
      imageUrl: null,
      sortOrder: 0,
      archivedAt: null,
      categoryIds: [],
      ...overrides,
    };
  }

  /**
   * An admin variant.
   * @param overrides Fields to change.
   * @returns The variant.
   */
  static variant(overrides: Partial<Variant> = {}): Variant {
    return {
      id: "00000000-0000-7000-8000-0000000000e1",
      productId: "00000000-0000-7000-8000-0000000000d1",
      sku: null,
      name: "Unidad",
      price: 2500,
      isDefault: true,
      isStockTracked: true,
      sortOrder: 0,
      archivedAt: null,
      ...overrides,
    };
  }
}
