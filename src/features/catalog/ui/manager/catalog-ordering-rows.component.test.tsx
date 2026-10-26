import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import baseMessages from "@/i18n/messages/es-CR";

import { BrandRows } from "./brand-rows.component";
import { CategoryRows } from "./category-rows.component";
import { ProductRows } from "./product-rows.component";
import { RecordAction } from "../../domain/manager";
import { CatalogRecords } from "../testing/catalog-records.helper";

vi.mock("./archive-record-button.component", () => ({ ArchiveRecordButton: () => null }));
vi.mock("./record-action-form.component", () => ({ RecordActionForm: () => null }));

vi.mock("../../server/brands/brands.actions", () => ({ updateBrandAction: vi.fn() }));
vi.mock("../../server/categories/categories.actions", () => ({ updateCategoryAction: vi.fn() }));
vi.mock("../../server/products/products.actions", () => ({ updateProductAction: vi.fn() }));
vi.mock("../../server/variants/variants.actions", () => ({ updateVariantAction: vi.fn() }));

const ordering = { move: vi.fn(), canMove: () => true, isPending: false, error: null };
const archivedAt = "2026-10-01T00:00:00Z";
const messages = {
  ...baseMessages,
  catalog: {
    ...baseMessages.catalog,
    manager: {
      ...baseMessages.catalog.manager,
      rows: {
        ...baseMessages.catalog.manager.rows,
        notVisible: "No visible: falta una presentación con precio",
      },
      ordering: { moveUp: "Subir {name}", moveDown: "Bajar {name}", label: "Orden de {name}" },
    },
  },
};

function renderRows(content: ReactNode) {
  render(
    <NextIntlClientProvider locale="es-CR" messages={messages}>
      {content}
    </NextIntlClientProvider>,
  );
}

describe("Catalog ordering rows", () => {
  it("shows ordering only for active products and warns when a default presentation is missing", () => {
    renderRows(
      <ProductRows
        rows={[
          {
            product: CatalogRecords.product(),
            brandLabel: "Snackyzz",
            defaultPrice: null,
            activeVariantCount: 0,
          },
          {
            product: CatalogRecords.product({ id: "archived", name: "Retirado", archivedAt }),
            brandLabel: "Snackyzz",
            defaultPrice: null,
            activeVariantCount: 0,
          },
        ]}
        archiveAction={RecordAction.ArchiveProduct}
        onEdit={vi.fn()}
        ordering={ordering}
      />,
    );
    expect(screen.getByRole("button", { name: "Subir Choco Cloud" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Subir Retirado" })).not.toBeInTheDocument();
    expect(screen.getAllByText("No visible: falta una presentación con precio")).toHaveLength(1);
  });

  it("shows ordering only for active brands", () => {
    renderRows(
      <BrandRows
        brands={[
          CatalogRecords.brand(),
          CatalogRecords.brand({ id: "archived", name: "Retirada", archivedAt }),
        ]}
        archiveAction={RecordAction.ArchiveBrand}
        setPrimaryAction={RecordAction.SetPrimaryBrand}
        onEdit={vi.fn()}
        ordering={ordering}
      />,
    );
    expect(screen.getByRole("button", { name: "Subir Snackyzz" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Subir Retirada" })).not.toBeInTheDocument();
  });

  it("shows ordering only for active categories", () => {
    renderRows(
      <CategoryRows
        categories={[
          CatalogRecords.category(),
          CatalogRecords.category({ id: "archived", name: "Retirada", archivedAt }),
        ]}
        archiveAction={RecordAction.ArchiveCategory}
        onEdit={vi.fn()}
        ordering={ordering}
      />,
    );
    expect(screen.getByRole("button", { name: "Subir Clásicas" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Subir Retirada" })).not.toBeInTheDocument();
  });
});
