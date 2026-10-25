import "server-only";

export { archiveProductAction, createProductAction, updateProductAction } from "./products.actions";
export {
  archiveProductCapability,
  createProductCapability,
  updateProductCapability,
} from "./products.capability";
export type { Product } from "./products.types";
