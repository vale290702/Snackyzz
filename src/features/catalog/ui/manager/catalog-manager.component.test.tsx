import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import messages from "@/i18n/messages/es-CR";

import { CatalogManager } from "./catalog-manager.component";
import type { CatalogManagerData } from "../../index";
import { archiveProductAction } from "../../server/products/products.actions";
import { CatalogRecords } from "../testing/catalog-records.helper";

vi.mock("../../server/brands/brands.actions", () => ({
  archiveBrandAction: vi.fn(),
  createBrandAction: vi.fn(),
  setPrimaryBrandAction: vi.fn(),
  updateBrandAction: vi.fn(),
}));
vi.mock("../../server/categories/categories.actions", () => ({
  archiveCategoryAction: vi.fn(),
  createCategoryAction: vi.fn(),
  updateCategoryAction: vi.fn(),
}));
vi.mock("../../server/products/products.actions", () => ({
  archiveProductAction: vi.fn(),
  createProductAction: vi.fn(),
  updateProductAction: vi.fn(),
}));
vi.mock("../../server/variants/variants.actions", () => ({
  archiveVariantAction: vi.fn(),
  createVariantAction: vi.fn(),
  setDefaultVariantAction: vi.fn(),
  updateVariantAction: vi.fn(),
}));
vi.mock("../../server/images/images.actions", () => ({
  createCatalogImageUploadAction: vi.fn(),
  registerCatalogImageUploadAction: vi.fn(),
}));

const copy = messages.catalog.manager;

const primary = CatalogRecords.brand();
const collab = CatalogRecords.brand({
  id: "00000000-0000-7000-8000-0000000000b2",
  slug: "baking-stereo",
  name: "Baking Stereo",
  isPrimary: false,
});
const choco = CatalogRecords.product({ badge: "La clásica" });
const unit = CatalogRecords.variant();
const box = CatalogRecords.variant({
  id: "00000000-0000-7000-8000-0000000000e2",
  name: "Caja de 6",
  price: 13500,
  isDefault: false,
  sku: "SNK-6",
});

const data: CatalogManagerData = {
  brands: [primary, collab],
  categories: [CatalogRecords.category()],
  products: [choco],
  variants: [unit, box],
};

function renderManager(managerData = data) {
  render(
    <NextIntlClientProvider locale="es-CR" messages={messages} timeZone="America/Costa_Rica">
      <CatalogManager data={managerData} />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CatalogManager", () => {
  it("opens on products, with labelled section and filter groups", () => {
    renderManager();

    expect(screen.getByRole("heading", { level: 1, name: copy.titles.products })).toBeVisible();
    const sections = screen.getByRole("group", { name: copy.viewsLabel });
    expect(within(sections).getByRole("button", { name: copy.views.products })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("group", { name: copy.filters.brandLabel })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: copy.filters.statusLabel })).toBeInTheDocument();
  });

  it("lists each product with its summary, brand, status and actions", () => {
    renderManager();

    const row = screen.getByRole("heading", { name: choco.name }).closest("li");
    expect(row).not.toBeNull();
    const item = within(row as HTMLElement);
    expect(item.getByText(/La clásica · ₡\s?2\s?500 · 2 presentaciones/)).toBeInTheDocument();
    expect(item.getByText(`${primary.name} · Posición 0`)).toBeInTheDocument();
    expect(item.getByText(copy.status.active)).toBeInTheDocument();
    expect(item.getByRole("button", { name: `Editar ${choco.name}` })).toBeInTheDocument();
  });

  it("hides products that don't match the status filter", async () => {
    renderManager();

    await userEvent.click(screen.getByRole("button", { name: copy.filters.archived }));

    expect(screen.queryByRole("heading", { name: choco.name })).not.toBeInTheDocument();
    expect(screen.getByText(copy.empty.noMatchesTitle)).toBeInTheDocument();
  });

  it("invites the owner to create the first record of an empty section", async () => {
    renderManager({ ...data, categories: [] });

    await userEvent.click(screen.getByRole("button", { name: copy.views.categories }));

    expect(screen.getByRole("heading", { level: 1, name: copy.titles.categories })).toBeVisible();
    expect(screen.getByText(copy.empty.categories)).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: copy.filters.brandLabel })).not.toBeInTheDocument();
  });

  it("opens a product's editor with labelled fields and its variants", async () => {
    renderManager();

    await userEvent.click(screen.getByRole("button", { name: `Editar ${choco.name}` }));

    const editor = screen.getByRole("region", { name: copy.productForm.editTitle });
    const form = within(editor).getByRole("form", { name: copy.productForm.editTitle });
    expect(within(form).getByLabelText(copy.fields.name)).toHaveValue(choco.name);
    expect(within(form).getByLabelText(copy.fields.slug)).toHaveAccessibleDescription(
      copy.fields.slugHint,
    );
    expect(within(form).getByRole("combobox", { name: copy.productForm.brand })).toHaveTextContent(
      primary.name,
    );
    expect(within(form).getByRole("checkbox", { name: "Clásicas" })).not.toBeChecked();
    expect(within(form).getByLabelText(copy.productForm.image)).toHaveAccessibleDescription(
      copy.image.productHint,
    );

    const variants = within(editor).getByRole("region", { name: copy.variants.title });
    expect(within(variants).getByText(copy.status.default)).toBeInTheDocument();
    expect(within(variants).getByText(/SKU SNK-6/)).toBeInTheDocument();
    expect(within(variants).getAllByRole("button", { name: copy.actions.setDefault })).toHaveLength(
      1,
    );
  });

  it("closes the editor from its close button", async () => {
    renderManager();

    await userEvent.click(screen.getByRole("button", { name: copy.create.products }));
    expect(screen.getByRole("region", { name: copy.productForm.createTitle })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: copy.actions.closeEditor }));
    expect(
      screen.queryByRole("region", { name: copy.productForm.createTitle }),
    ).not.toBeInTheDocument();
  });

  it("translates field codes and links them to their inputs", async () => {
    renderManager();

    await userEvent.click(screen.getByRole("button", { name: copy.views.categories }));
    await userEvent.click(screen.getByRole("button", { name: copy.create.categories }));
    await userEvent.type(screen.getByLabelText(copy.fields.name), "Clásicas");
    await userEvent.type(screen.getByLabelText(copy.fields.slug), "Clásicas");
    await userEvent.click(screen.getByRole("button", { name: copy.categoryForm.submit }));

    const slug = await screen.findByLabelText(copy.fields.slug);
    expect(slug).toHaveAttribute("aria-invalid", "true");
    expect(slug).toHaveAccessibleDescription(
      `${copy.fields.slugHint} ${messages.errors.catalog.slug_invalid}`,
    );
    expect(screen.getByLabelText(copy.fields.name)).toHaveValue("Clásicas");
  });

  it("asks before archiving and shows why the archive was refused", async () => {
    vi.mocked(archiveProductAction).mockResolvedValue({ ok: false, error: "product_not_found" });
    renderManager();

    await userEvent.click(screen.getByRole("button", { name: copy.actions.archive }));
    const dialog = screen.getByRole("dialog", { name: `¿Archivar ${choco.name}?` });
    expect(dialog).toHaveAccessibleDescription(copy.archiveDialog.description);

    await userEvent.click(within(dialog).getByRole("button", { name: copy.archiveDialog.confirm }));

    expect(archiveProductAction).toHaveBeenCalledWith({ id: choco.id });
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      messages.errors.catalog.product_not_found,
    );
  });

  it("marks the primary brand and offers to make another one primary", async () => {
    renderManager();

    await userEvent.click(screen.getByRole("button", { name: copy.views.brands }));

    const primaryRow = screen.getByRole("heading", { name: primary.name }).closest("li");
    const collabRow = screen.getByRole("heading", { name: collab.name }).closest("li");
    expect(within(primaryRow as HTMLElement).getByText(copy.status.primary)).toBeInTheDocument();
    expect(
      within(primaryRow as HTMLElement).queryByRole("button", { name: copy.actions.archive }),
    ).not.toBeInTheDocument();
    expect(
      within(collabRow as HTMLElement).getByRole("button", { name: copy.actions.setPrimary }),
    ).toBeInTheDocument();
    expect(
      within(collabRow as HTMLElement).getByText("/brands/baking-stereo · Posición 0"),
    ).toBeInTheDocument();
  });
});
