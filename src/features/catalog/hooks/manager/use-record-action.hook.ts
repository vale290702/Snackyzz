"use client";

import { useFormAction } from "@/shared/lib/form-action";
import type { ActionResult } from "@/shared/lib/run-action";

import type { CatalogErrorCode } from "../../domain/errors";
import { CatalogFieldError, recordIdInputSchema } from "../../domain/fields";
import { RecordAction, type RecordActionValue } from "../../domain/manager";
import { archiveBrandAction, setPrimaryBrandAction } from "../../server/brands/brands.actions";
import { archiveCategoryAction } from "../../server/categories/categories.actions";
import { archiveProductAction } from "../../server/products/products.actions";
import {
  archiveVariantAction,
  setDefaultVariantAction,
} from "../../server/variants/variants.actions";

/**
 * A one-button change: its result value is not shown, only whether it was refused.
 */
type RecordServerAction = (input: unknown) => Promise<ActionResult<unknown, CatalogErrorCode>>;

const RECORD_ACTIONS: Record<RecordActionValue, RecordServerAction> = {
  [RecordAction.ArchiveBrand]: archiveBrandAction,
  [RecordAction.SetPrimaryBrand]: setPrimaryBrandAction,
  [RecordAction.ArchiveCategory]: archiveCategoryAction,
  [RecordAction.ArchiveProduct]: archiveProductAction,
  [RecordAction.ArchiveVariant]: archiveVariantAction,
  [RecordAction.SetDefaultVariant]: setDefaultVariantAction,
};

/**
 * State for a one-button form that archives a record or makes it the primary brand or default
 * variant; the record's id is a hidden field.
 * @param action Which change the button makes.
 * @param onDone What to do once the change is made, such as closing a confirmation.
 * @returns The form action, pending flag, and the error code when the change was refused or the
 * hidden id was malformed.
 */
export function useRecordAction(action: RecordActionValue, onDone?: () => void) {
  return useFormAction({
    schema: recordIdInputSchema,
    action: async (input) => {
      const result = await RECORD_ACTIONS[action](input);
      if (result.ok) {
        onDone?.();
      }

      return result;
    },
    fieldErrorCodes: Object.values(CatalogFieldError),
  });
}
