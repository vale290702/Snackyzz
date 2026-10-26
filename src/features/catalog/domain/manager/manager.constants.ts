/**
 * The lists catalog management switches between.
 */
export const CatalogManagerView = {
  Products: "products",
  Brands: "brands",
  Categories: "categories",
} as const;

/**
 * Which records a list shows by whether they are archived.
 */
export const RecordStatusFilter = {
  All: "all",
  Active: "active",
  Archived: "archived",
} as const;

/**
 * The brand filter value that shows every brand.
 */
export const ALL_BRANDS = "all";

/**
 * The editor target for a record that does not exist yet.
 */
export const NEW_RECORD = "new";

/**
 * One-click record changes in catalog management, each backed by one Server Action.
 */
export const RecordAction = {
  ArchiveBrand: "archiveBrand",
  SetPrimaryBrand: "setPrimaryBrand",
  ArchiveCategory: "archiveCategory",
  ArchiveProduct: "archiveProduct",
  ArchiveVariant: "archiveVariant",
  SetDefaultVariant: "setDefaultVariant",
} as const;

/**
 * The color a new product starts with: the brand orange, as on the storefront.
 */
export const NEW_PRODUCT_ACCENT_COLOR = "#ED781A";
