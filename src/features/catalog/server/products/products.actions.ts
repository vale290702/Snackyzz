"use server";

import "server-only";

import type { ActionResult } from "@/shared/lib/run-action";

import {
  archiveProductCapability,
  createProductCapability,
  updateProductCapability,
} from "./products.capability";
import type { Product } from "./products.types";
import type { CatalogErrorCode } from "../../domain/errors";
import { runCatalogMutation } from "../mutation";

/**
 * Creates a product for the signed-in catalog manager.
 * @param input Untrusted product fields and category ids.
 * @returns The product, or why it was not created.
 * @throws Redirects to sign-in without an admin session.
 */
export async function createProductAction(
  input: unknown,
): Promise<ActionResult<Product, CatalogErrorCode>> {
  return runCatalogMutation("catalog.createProduct", createProductCapability, input);
}

/**
 * Replaces an active product's fields and categories.
 * @param input Untrusted product id, fields and category ids.
 * @returns The product, or why it was not updated.
 * @throws Redirects to sign-in without an admin session.
 */
export async function updateProductAction(
  input: unknown,
): Promise<ActionResult<Product, CatalogErrorCode>> {
  return runCatalogMutation("catalog.updateProduct", updateProductCapability, input);
}

/**
 * Archives a product.
 * @param input Untrusted `{ id }`.
 * @returns The archived product, or why it was not archived.
 * @throws Redirects to sign-in without an admin session.
 */
export async function archiveProductAction(
  input: unknown,
): Promise<ActionResult<Product, CatalogErrorCode>> {
  return runCatalogMutation("catalog.archiveProduct", archiveProductCapability, input);
}
