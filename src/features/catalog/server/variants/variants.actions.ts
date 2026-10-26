"use server";

import "server-only";

import type { ActionResult } from "@/shared/lib/run-action";

import {
  archiveVariantCapability,
  createVariantCapability,
  setDefaultVariantCapability,
  updateVariantCapability,
} from "./variants.capability";
import type { Variant } from "./variants.types";
import type { CatalogErrorCode } from "../../domain/errors";
import { runCatalogMutation } from "../mutation";

/**
 * Adds a variant to a product for the signed-in catalog manager.
 * @param input Untrusted variant fields with its product id.
 * @returns The variant, or why it was not created.
 * @throws Redirects to sign-in without an admin session.
 */
export async function createVariantAction(
  input: unknown,
): Promise<ActionResult<Variant, CatalogErrorCode>> {
  return runCatalogMutation("catalog.createVariant", createVariantCapability, input);
}

/**
 * Replaces an active variant's fields.
 * @param input Untrusted variant id and fields.
 * @returns The variant, or why it was not updated.
 * @throws Redirects to sign-in without an admin session.
 */
export async function updateVariantAction(
  input: unknown,
): Promise<ActionResult<Variant, CatalogErrorCode>> {
  return runCatalogMutation("catalog.updateVariant", updateVariantCapability, input);
}

/**
 * Archives a variant that is not its product's default.
 * @param input Untrusted `{ id }`.
 * @returns The archived variant, or why it was not archived.
 * @throws Redirects to sign-in without an admin session.
 */
export async function archiveVariantAction(
  input: unknown,
): Promise<ActionResult<Variant, CatalogErrorCode>> {
  return runCatalogMutation("catalog.archiveVariant", archiveVariantCapability, input);
}

/**
 * Makes an active variant its product's default.
 * @param input Untrusted `{ id }`.
 * @returns The new default variant, or why it was not changed.
 * @throws Redirects to sign-in without an admin session.
 */
export async function setDefaultVariantAction(
  input: unknown,
): Promise<ActionResult<Variant, CatalogErrorCode>> {
  return runCatalogMutation("catalog.setDefaultVariant", setDefaultVariantCapability, input);
}
