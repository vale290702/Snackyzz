"use server";

import "server-only";

import type { ActionResult } from "@/shared/lib/run-action";

import {
  archiveBrandCapability,
  createBrandCapability,
  setPrimaryBrandCapability,
  updateBrandCapability,
} from "./brands.capability";
import type { Brand } from "./brands.types";
import type { CatalogErrorCode } from "../../domain/errors";
import { runCatalogMutation } from "../mutation";

/**
 * Creates a brand for the signed-in catalog manager.
 * @param input Untrusted brand fields.
 * @returns The brand, or why it was not created.
 * @throws Redirects to sign-in without an admin session.
 */
export async function createBrandAction(
  input: unknown,
): Promise<ActionResult<Brand, CatalogErrorCode>> {
  return runCatalogMutation("catalog.createBrand", createBrandCapability, input);
}

/**
 * Replaces an active brand's fields.
 * @param input Untrusted brand id and fields.
 * @returns The brand, or why it was not updated.
 * @throws Redirects to sign-in without an admin session.
 */
export async function updateBrandAction(
  input: unknown,
): Promise<ActionResult<Brand, CatalogErrorCode>> {
  return runCatalogMutation("catalog.updateBrand", updateBrandCapability, input);
}

/**
 * Archives a brand that is not the primary one.
 * @param input Untrusted `{ id }`.
 * @returns The archived brand, or why it was not archived.
 * @throws Redirects to sign-in without an admin session.
 */
export async function archiveBrandAction(
  input: unknown,
): Promise<ActionResult<Brand, CatalogErrorCode>> {
  return runCatalogMutation("catalog.archiveBrand", archiveBrandCapability, input);
}

/**
 * Makes an active brand the primary one.
 * @param input Untrusted `{ id }`.
 * @returns The new primary brand, or why it was not changed.
 * @throws Redirects to sign-in without an admin session.
 */
export async function setPrimaryBrandAction(
  input: unknown,
): Promise<ActionResult<Brand, CatalogErrorCode>> {
  return runCatalogMutation("catalog.setPrimaryBrand", setPrimaryBrandCapability, input);
}
