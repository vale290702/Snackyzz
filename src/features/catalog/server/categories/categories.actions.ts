"use server";

import "server-only";

import type { ActionResult } from "@/shared/lib/run-action";

import {
  archiveCategoryCapability,
  createCategoryCapability,
  updateCategoryCapability,
} from "./categories.capability";
import type { Category } from "./categories.types";
import type { CatalogErrorCode } from "../../domain/errors";
import { runCatalogMutation } from "../mutation";

/**
 * Creates a category for the signed-in catalog manager.
 * @param input Untrusted category fields.
 * @returns The category, or why it was not created.
 * @throws Redirects to sign-in without an admin session.
 */
export async function createCategoryAction(
  input: unknown,
): Promise<ActionResult<Category, CatalogErrorCode>> {
  return runCatalogMutation("catalog.createCategory", createCategoryCapability, input);
}

/**
 * Replaces an active category's fields.
 * @param input Untrusted category id and fields.
 * @returns The category, or why it was not updated.
 * @throws Redirects to sign-in without an admin session.
 */
export async function updateCategoryAction(
  input: unknown,
): Promise<ActionResult<Category, CatalogErrorCode>> {
  return runCatalogMutation("catalog.updateCategory", updateCategoryCapability, input);
}

/**
 * Archives a category.
 * @param input Untrusted `{ id }`.
 * @returns The archived category, or why it was not archived.
 * @throws Redirects to sign-in without an admin session.
 */
export async function archiveCategoryAction(
  input: unknown,
): Promise<ActionResult<Category, CatalogErrorCode>> {
  return runCatalogMutation("catalog.archiveCategory", archiveCategoryCapability, input);
}
