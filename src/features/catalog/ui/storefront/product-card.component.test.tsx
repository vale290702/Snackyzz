import { render, screen, waitFor, within } from "@testing-library/react";
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
  it("labels the minimum and opens choice without purchasing, then returns focus on Escape", async () => {
    const addToCart = vi.fn();
    const product = CatalogRecords.productDto({
      variants: [
        { ...unit, price: 2500 },
        { ...box, price: 1200 },
      ],
    });
    renderCard(
      product,
      <ProductPurchaseProvider purchase={{ addToCart }}>
        <ProductCard product={product} brandLabel="Snackyzz" look={ProductLook.Classic} />
      </ProductPurchaseProvider>,
    );
    expect(screen.getByText("Desde")).toBeInTheDocument();
    expect(screen.getByText("2 presentaciones")).toBeInTheDocument();
    expect(screen.getByText(/1\s?200/)).toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Elegir presentación" });
    await userEvent.click(trigger);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(addToCart).not.toHaveBeenCalled();
    const radio = screen.getByRole("radio", { name: /Unidad/ });
    await userEvent.click(radio);
    await userEvent.click(screen.getByRole("radio", { name: /Caja de 6/ }));
    await waitFor(() => expect(screen.getByRole("radio", { name: /Caja de 6/ })).toBeChecked());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
  });

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
