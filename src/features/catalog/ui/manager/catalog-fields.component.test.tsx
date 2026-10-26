import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import messages from "@/i18n/messages/es-CR";

import { AccentColorField } from "./accent-color-field.component";
import { NameSlugFields } from "./name-slug-fields.component";
import { CategoryCheckboxes } from "./product-placement-fields.component";
import { CatalogRecords } from "../testing/catalog-records.helper";

function renderFields(children: ReactNode) {
  return render(
    <NextIntlClientProvider locale="es-CR" messages={messages}>
      <form>{children}</form>
    </NextIntlClientProvider>,
  );
}

describe("catalog fields accessibility", () => {
  it("labels generated links and provides an explicit edit button", async () => {
    renderFields(
      <NameSlugFields prefix="test" name="" slug="" nameError={null} slugError={null} />,
    );
    const name = screen.getByLabelText(messages.catalog.manager.fields.name);
    const slug = screen.getByLabelText(messages.catalog.manager.fields.slug);
    await userEvent.type(name, "Limón");
    expect(slug).toHaveValue("limon");
    expect(slug).toHaveAttribute("readonly");
    await userEvent.click(
      screen.getByRole("button", { name: messages.catalog.manager.fields.editSlug }),
    );
    expect(slug).not.toHaveAttribute("readonly");
  });
  it("offers named palette buttons, a custom picker and a typed hex input", async () => {
    renderFields(<AccentColorField initialColor="#ED781A" error={null} />);
    await userEvent.click(
      screen.getByRole("radio", { name: messages.catalog.manager.colors.chocolate }),
    );
    const hex = screen.getByLabelText(messages.catalog.manager.colors.hex);
    expect(hex).toHaveValue("#3C1907");
    expect(screen.getByLabelText(messages.catalog.manager.colors.custom)).toHaveValue("#3c1907");
    await userEvent.clear(hex);
    await userEvent.type(hex, "#123456");
    expect(hex).toHaveValue("#123456");
  });
  it("keeps selected categories submitted when search hides their checkboxes", async () => {
    const category = CatalogRecords.category({ name: "Clásicas" });
    const { container } = renderFields(
      <CategoryCheckboxes
        options={[category]}
        categoryIds={[category.id]}
        onToggle={vi.fn()}
        error={null}
      />,
    );
    await userEvent.type(
      screen.getByLabelText(messages.catalog.manager.productForm.searchCategories),
      "unknown",
    );
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    expect(new FormData(form ?? undefined).getAll("categoryIds")).toEqual([category.id]);
    expect(screen.getByRole("status")).toHaveTextContent(
      messages.catalog.manager.productForm.noCategoryResults,
    );
  });
});
