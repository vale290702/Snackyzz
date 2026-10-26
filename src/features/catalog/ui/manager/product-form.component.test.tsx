import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import messages from "@/i18n/messages/es-CR";

import { ProductForm } from "./product-form.component";
import { CatalogRecords } from "../testing/catalog-records.helper";

vi.mock("../../server/products/products.actions", () => ({ saveProductAction: vi.fn() }));
vi.mock("../../server/images/images.actions", () => ({
  createCatalogImageUploadAction: vi.fn(),
  registerCatalogImageUploadAction: vi.fn(),
}));

const brand = CatalogRecords.brand();
const product = CatalogRecords.product({ sortOrder: 7 });
const first = CatalogRecords.variant();
const second = CatalogRecords.variant({
  id: "00000000-0000-7000-8000-0000000000e2",
  isDefault: false,
});

function form(record = product, variants = [first]) {
  return (
    <NextIntlClientProvider locale="es-CR" messages={messages}>
      <h2 id="catalog-editor-title">{messages.catalog.manager.productForm.editTitle}</h2>
      <ProductForm
        product={record}
        variants={variants}
        brands={[brand]}
        categories={[CatalogRecords.category()]}
        defaultBrandId={brand.id}
        onSaved={vi.fn()}
      />
    </NextIntlClientProvider>
  );
}

describe("ProductForm", () => {
  it("edits one presentation inline without showing the list position", () => {
    const { container } = render(form());
    expect(
      screen.getByLabelText(messages.catalog.manager.productForm.presentationName),
    ).toHaveValue(first.name);
    expect(screen.getByLabelText(messages.catalog.manager.variants.price)).toHaveValue(first.price);
    expect(
      screen.queryByLabelText(messages.catalog.manager.fields.sortOrder),
    ).not.toBeInTheDocument();
    expect(container.querySelector("form")).toHaveAttribute("aria-busy", "false");
    expect(screen.getByText(messages.catalog.manager.productForm.moreOptions)).toHaveProperty(
      "tagName",
      "SUMMARY",
    );
  });
  it("leaves multiple presentations to their management section", () => {
    render(form(product, [first, second]));
    expect(
      screen.queryByLabelText(messages.catalog.manager.variants.price),
    ).not.toBeInTheDocument();
  });
  it("warns when an existing product has no default presentation", () => {
    render(form(product, []));
    expect(screen.getByRole("status")).toHaveTextContent(
      messages.catalog.manager.productForm.notVisible,
    );
    expect(
      screen.getByLabelText(messages.catalog.manager.productForm.presentationName),
    ).toHaveValue("Unidad");
  });
});
