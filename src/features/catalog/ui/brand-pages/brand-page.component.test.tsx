import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import messages from "@/i18n/messages/es-CR";

import { BrandPage } from "./brand-page.component";
import type { BrandShelf } from "../../index";
import { CatalogRecords } from "../testing/catalog-records.helper";

vi.mock("next/font/local", () => ({
  default: () => ({ className: "font-bodoni", variable: "font-bodoni-variable" }),
}));

const snackyzz = CatalogRecords.brandDto();
const bakingStereo = CatalogRecords.brandDto({
  id: "brand-baking",
  slug: "baking-stereo",
  name: "Baking Stereo",
  tagline: null,
  label: "Snackyzz x Baking Stereo",
  isPrimary: false,
});
const chip = CatalogRecords.productDto({ id: "product-chip", name: "Chocolate Chip" });

function renderPage(shelf: BrandShelf) {
  render(
    <NextIntlClientProvider locale="es-CR" messages={messages} timeZone="America/Costa_Rica">
      <BrandPage shelf={shelf} />
    </NextIntlClientProvider>,
  );
}

describe("BrandPage", () => {
  it("renders a brand without a bespoke page with its own copy and products", () => {
    renderPage({ brand: snackyzz, products: [CatalogRecords.productDto()], otherBrands: [] });

    const main = screen.getByRole("main");
    expect(within(main).getByRole("heading", { level: 1, name: snackyzz.name })).toBeVisible();
    expect(within(main).getByText(snackyzz.description ?? "")).toBeInTheDocument();
    expect(within(main).getByRole("heading", { name: "Choco Cloud" })).toBeInTheDocument();
  });

  it("links to the other brands from a labelled navigation", () => {
    renderPage({ brand: snackyzz, products: [], otherBrands: [bakingStereo] });

    const switcher = screen.getByRole("navigation");
    expect(switcher).toHaveAccessibleName(/marcas/i);
    expect(
      within(switcher).getByRole("link", { name: new RegExp(bakingStereo.name) }),
    ).toHaveAttribute("href", "/brands/baking-stereo");
  });

  it("says when a brand has no products yet and suggests another brand", () => {
    renderPage({ brand: snackyzz, products: [], otherBrands: [bakingStereo] });

    expect(screen.getByText(messages.catalog.shelf.emptyTitle)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: new RegExp(bakingStereo.name) })[0]).toHaveAttribute(
      "href",
      "/brands/baking-stereo",
    );
  });

  it("uses the bespoke page for a brand that has one, linking back to the primary shop", () => {
    renderPage({ brand: bakingStereo, products: [chip], otherBrands: [snackyzz] });

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Chocolate Chip" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: messages.catalog.brandPages.bakingStereo.switchLink }),
    ).toHaveAttribute("href", "/shop");
  });
});
