import type { ProductLook } from "./product-look.constants";

/**
 * A look for product cards.
 */
export type ProductLookValue = (typeof ProductLook)[keyof typeof ProductLook];
