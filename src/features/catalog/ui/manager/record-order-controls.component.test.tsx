import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import { RecordOrderControls } from "./record-order-controls.component";
import {
  CatalogOrderDirection,
  CatalogOrderKind,
} from "../../domain/manager/catalog-ordering.constants";

vi.mock("../../server/brands/brands.actions", () => ({ updateBrandAction: vi.fn() }));
vi.mock("../../server/categories/categories.actions", () => ({ updateCategoryAction: vi.fn() }));
vi.mock("../../server/products/products.actions", () => ({ updateProductAction: vi.fn() }));
vi.mock("../../server/variants/variants.actions", () => ({ updateVariantAction: vi.fn() }));

const messages = {
  catalog: {
    manager: {
      ordering: {
        moveUp: "Subir {name}",
        moveDown: "Bajar {name}",
        label: "Orden de {name}",
      },
    },
  },
};

describe("RecordOrderControls", () => {
  it("renders named keyboard buttons with unavailable boundaries disabled and touch targets", () => {
    render(
      <NextIntlClientProvider locale="es-CR" messages={messages}>
        <RecordOrderControls
          kind={CatalogOrderKind.Products}
          recordId="first"
          recordName="Choco"
          ordering={{
            move: vi.fn(),
            canMove: (_kind, _id, direction) => direction === CatalogOrderDirection.Down,
            isPending: false,
            error: null,
          }}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole("group", { name: "Orden de Choco" })).toBeVisible();
    const up = screen.getByRole("button", { name: "Subir Choco" });
    const down = screen.getByRole("button", { name: "Bajar Choco" });
    expect(up).toBeDisabled();
    expect(down).toBeEnabled();
    expect(down).toHaveAttribute("type", "button");
    expect(down).toHaveClass("min-h-11", "min-w-11");
  });

  it("disables both buttons during a shared ordering transition", () => {
    render(
      <NextIntlClientProvider locale="es-CR" messages={messages}>
        <RecordOrderControls
          kind={CatalogOrderKind.Variants}
          recordId="unit"
          recordName="Unidad"
          ordering={{ move: vi.fn(), canMove: () => true, isPending: true, error: null }}
        />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole("button", { name: "Subir Unidad" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Bajar Unidad" })).toBeDisabled();
  });
});
