"use client";

import { useState, useTransition } from "react";

import { SharedError, type SharedErrorCode } from "@/shared/lib/result";
import type { ActionResult } from "@/shared/lib/run-action";

import type { CatalogErrorCode } from "../../domain/errors";
import { CatalogOrderKind } from "../../domain/manager/catalog-ordering.constants";
import { CatalogOrdering } from "../../domain/manager/catalog-ordering.helper";
import type {
  CatalogOrderDirectionValue,
  CatalogOrderKindValue,
  OrderedCatalogRecord,
} from "../../domain/manager/catalog-ordering.types";
import type { CatalogManagerData } from "../../index";
import { updateBrandAction } from "../../server/brands/brands.actions";
import { updateCategoryAction } from "../../server/categories/categories.actions";
import { updateProductAction } from "../../server/products/products.actions";
import { updateVariantAction } from "../../server/variants/variants.actions";

/**
 * A sequence of complete records routed to their existing update action.
 */
type OrderPlan = {
  records: OrderedCatalogRecord[];
  update: (input: unknown) => Promise<ActionResult<unknown, CatalogErrorCode>>;
};

function planMove(
  data: CatalogManagerData,
  kind: CatalogOrderKindValue,
  id: string,
  direction: CatalogOrderDirectionValue,
): OrderPlan {
  switch (kind) {
    case CatalogOrderKind.Products:
      return {
        records: CatalogOrdering.move(data.products, id, direction, "brandId"),
        update: updateProductAction,
      };
    case CatalogOrderKind.Brands:
      return {
        records: CatalogOrdering.move(data.brands, id, direction),
        update: updateBrandAction,
      };
    case CatalogOrderKind.Categories:
      return {
        records: CatalogOrdering.move(data.categories, id, direction),
        update: updateCategoryAction,
      };
    case CatalogOrderKind.Variants:
      return {
        records: CatalogOrdering.move(data.variants, id, direction, "productId"),
        update: updateVariantAction,
      };
  }
}

/**
 * Coordinates one catalog ordering operation at a time across every visible list.
 * @param data Current server records; normal action revalidation reflects each completed write.
 * @returns Adjacent move handlers, availability, pending state and a failure code.
 */
export function useCatalogOrdering(data: CatalogManagerData) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<CatalogErrorCode | SharedErrorCode | null>(null);

  const canMove = (
    kind: CatalogOrderKindValue,
    id: string,
    direction: CatalogOrderDirectionValue,
  ) => !isPending && planMove(data, kind, id, direction).records.length > 0;

  const move = (kind: CatalogOrderKindValue, id: string, direction: CatalogOrderDirectionValue) => {
    if (isPending) {
      return;
    }

    const plan = planMove(data, kind, id, direction);
    if (plan.records.length === 0) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        for (const record of plan.records) {
          const result = await plan.update(record);
          if (!result.ok) {
            setError(result.error);
            break;
          }
        }
      } catch {
        setError(SharedError.Unexpected);
      }
    });
  };

  return { move, canMove, isPending, error };
}

export {
  CatalogOrderDirection,
  CatalogOrderKind,
} from "../../domain/manager/catalog-ordering.constants";
