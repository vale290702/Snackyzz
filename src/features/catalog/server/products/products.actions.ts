"use server";

import "server-only";

import type { ActionResult } from "@/shared/lib/run-action";

import {
  archiveProductCapability,
  createProductCapability,
  saveProductCapability,
  updateProductCapability,
} from "./products.capability";
import type { Product, SavedProduct } from "./products.types";
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
 * Saves the product editor's submission: a new or existing product and its only presentation.
 * @param input Untrusted product fields, the product id when it exists, and the presentation.
 * @returns The saved product and any presentation failure, or why the product was not saved.
 * @throws Redirects to sign-in without an admin session.
 */
export async function saveProductAction(
  input: unknown,
): Promise<ActionResult<SavedProduct, CatalogErrorCode>> {
  return runCatalogMutation("catalog.saveProduct", saveProductCapability, input);
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
