import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import messages from "@/i18n/messages/es-CR";

import { AccentColorField } from "./accent-color-field.component";
import { NameSlugFields } from "./name-slug-fields.component";
import { CategoryCheckboxes } from "./product-placement-fields.component";
import { useNameSlugFields } from "../../hooks/manager/use-name-slug-fields.hook";
import { CatalogRecords } from "../testing/catalog-records.helper";

function renderFields(children: ReactNode) {
  return render(
    <NextIntlClientProvider locale="es-CR" messages={messages}>
      <form>{children}</form>
    </NextIntlClientProvider>,
  );
}

function NewRecordNameSlug() {
  const form = useForm({ defaultValues: { name: "", slug: "" } });
  const nameSlug = useNameSlugFields({
    initialSlug: "",
    setSlug: (slug) => form.setValue("slug", slug),
  });

  return (
    <NameSlugFields
      prefix="test"
      name={form.register("name", { onChange: nameSlug.nameChanged })}
      slug={form.register("slug")}
      isEditingSlug={nameSlug.isEditingSlug}
      onEditSlug={nameSlug.editSlug}
      nameError={null}
      slugError={null}
    />
  );
}

function ControlledAccentColor() {
  const [color, setColor] = useState("#ED781A");

  return <AccentColorField color={color} onColorChange={setColor} error={null} />;
}

describe("catalog fields accessibility", () => {
  it("labels generated links and provides an explicit edit button", async () => {
    renderFields(<NewRecordNameSlug />);
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

  it("offers named palette radios, a custom picker and a typed hex input", async () => {
    renderFields(<ControlledAccentColor />);

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

  it("announces when the search hides every category and toggles visible ones", async () => {
    const category = CatalogRecords.category({ name: "Clásicas" });
    const onToggle = vi.fn();
    renderFields(
      <CategoryCheckboxes options={[category]} categoryIds={[]} onToggle={onToggle} error={null} />,
    );

    await userEvent.click(screen.getByRole("checkbox", { name: "Clásicas" }));
    expect(onToggle).toHaveBeenCalledWith(category.id, true);

    await userEvent.type(
      screen.getByLabelText(messages.catalog.manager.productForm.searchCategories),
      "unknown",
    );
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      messages.catalog.manager.productForm.noCategoryResults,
    );
  });
});
