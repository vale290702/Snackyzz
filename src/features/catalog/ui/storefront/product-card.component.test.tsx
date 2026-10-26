import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import messages from "@/i18n/messages/es-CR";

import { ProductCard } from "./product-card.component";
import { ProductLook } from "./product-look.constants";
import { ProductPurchaseProvider } from "./product-purchase-provider.component";
import { CatalogRecords } from "../testing/catalog-records.helper";

const unit = CatalogRecords.variantDto();
const box = CatalogRecords.variantDto({
  id: "variant-box",
  name: "Caja de 6",
  price: 13500,
  isDefault: false,
});

function renderCard(product = CatalogRecords.productDto(), cart: ReactNode = null) {
  const card = <ProductCard product={product} brandLabel="Snackyzz" look={ProductLook.Classic} />;

  render(
    <NextIntlClientProvider locale="es-CR" messages={messages} timeZone="America/Costa_Rica">
      {cart === null ? card : cart}
    </NextIntlClientProvider>,
  );
}

describe("ProductCard", () => {
  it("shows the product's name, badge, default price and photo", () => {
    renderCard();

    expect(screen.getByRole("heading", { name: "Choco Cloud" })).toBeInTheDocument();
    expect(screen.getByText("La clásica")).toBeInTheDocument();
    expect(screen.getByText(/2\s?500/)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Choco Cloud" })).toBeInTheDocument();
  });

  it("keeps add to cart disabled until the cart provides a purchase", () => {
    renderCard();

    expect(screen.getByRole("button", { name: messages.catalog.product.addToCart })).toBeDisabled();
  });

  it("adds the default variant through the cart", async () => {
    const addToCart = vi.fn();
    const product = CatalogRecords.productDto();
    renderCard(
      product,
      <ProductPurchaseProvider purchase={{ addToCart }}>
        <ProductCard product={product} brandLabel="Snackyzz" look={ProductLook.Classic} />
      </ProductPurchaseProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: messages.catalog.product.addToCart }));

    expect(addToCart).toHaveBeenCalledWith(unit.id);
  });

  it("opens a labelled dialog without a variant picker for one variant", async () => {
    renderCard();

    await userEvent.click(screen.getByRole("button", { name: "Choco Cloud" }));

    const dialog = screen.getByRole("dialog", { name: "Choco Cloud" });
    expect(dialog).toHaveAccessibleDescription(CatalogRecords.productDto().description);
    expect(within(dialog).queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole("button", { name: messages.catalog.product.closeDetails }),
    ).toBeInTheDocument();
  });

  it("offers every variant in the dialog when there are two or more, and shows the chosen price", async () => {
    renderCard(CatalogRecords.productDto({ variants: [unit, box] }));

    await userEvent.click(screen.getByRole("button", { name: "Choco Cloud" }));
    const dialog = screen.getByRole("dialog");
    const picker = within(dialog).getByRole("radiogroup");

    expect(
      within(dialog).getByRole("group", { name: messages.catalog.product.variantLegend }),
    ).toBeInTheDocument();
    expect(within(picker).getByRole("radio", { name: /Unidad/ })).toBeChecked();

    await userEvent.click(within(picker).getByRole("radio", { name: /Caja de 6/ }));

    expect(within(picker).getByRole("radio", { name: /Caja de 6/ })).toBeChecked();
    expect(within(dialog).getAllByText(/13\s?500/).length).toBeGreaterThan(1);
  });
});
