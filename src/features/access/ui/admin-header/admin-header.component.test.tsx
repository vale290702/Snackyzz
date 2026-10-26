import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";

import messages from "@/i18n/messages/es-CR";

import { AdminHeader } from "./admin-header.component";
import { AdminSection } from "./admin-sections.constants";

function renderHeader(header: React.ReactNode) {
  return render(
    <NextIntlClientProvider locale="es-CR" messages={messages}>
      {header}
    </NextIntlClientProvider>,
  );
}

describe("AdminHeader", () => {
  it("links every section and marks the open one as the current page", () => {
    renderHeader(
      <AdminHeader
        actions={<button type="button">Salir</button>}
        activeSection={AdminSection.Catalog}
      />,
    );

    const tabs = screen.getByRole("navigation", { name: messages.access.header.sectionsLabel });
    const products = screen.getByRole("link", { name: messages.access.header.sections.catalog });
    const orders = screen.getByRole("link", { name: messages.access.header.sections.orders });

    expect(tabs).toContainElement(products);
    expect(products).toHaveAttribute("href", "/admin/catalog");
    expect(products).toHaveAttribute("aria-current", "page");
    expect(orders).toHaveAttribute("href", "/admin");
    expect(orders).not.toHaveAttribute("aria-current");
  });

  it("names the section instead of showing tabs on sign-in", () => {
    renderHeader(<AdminHeader />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.getByText(messages.access.header.section)).toBeVisible();
  });
});
