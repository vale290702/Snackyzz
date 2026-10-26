import { expect, test, type Page } from "@playwright/test";

const DEMO_PASSWORD = "snackyzz-demo";

async function signInAs(page: Page, email: string) {
  await page.goto("/admin/sign-in");
  await page.getByLabel("Correo de administración").fill(email);
  await page.getByLabel("Contraseña de administración").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test("visitors without a session are sent from catalog management to sign-in", async ({ page }) => {
  await page.goto("/admin/catalog");

  await expect(page).toHaveURL(/\/admin\/sign-in$/);
});

test("staff can't reach catalog management", async ({ page }) => {
  await signInAs(page, "staff@snackyzz.test");

  // The 403 is raised inside a streamed Suspense boundary, so the status is already sent.
  await page.goto("/admin/catalog");

  await expect(
    page.getByRole("heading", { level: 1, name: "No tienes acceso a esta sección" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Productos." })).toHaveCount(0);
});

test("the owner manages the catalog", async ({ page }) => {
  await signInAs(page, "owner@snackyzz.test");

  await page.goto("/admin/catalog");

  await expect(page.getByRole("heading", { level: 1, name: "Productos." })).toBeVisible();
  await page.getByRole("button", { name: "Editar Choco Cloud" }).click();
  const editor = page.getByRole("region", { name: "Editar producto" });
  await expect(editor.getByLabel("Nombre", { exact: true })).toHaveValue("Choco Cloud");
  await expect(editor.getByRole("region", { name: "Presentaciones" })).toContainText("Unidad");
});

test("shoppers browse the shop and open a product", async ({ page }) => {
  await page.goto("/shop");

  await expect(page.getByRole("heading", { level: 1, name: "Snackyzz" })).toBeVisible();
  await page.getByRole("button", { name: "Choco Cloud", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: "Choco Cloud" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("radiogroup")).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "Agregar al carrito" })).toBeDisabled();

  await dialog.getByRole("button", { name: "Cerrar detalles" }).click();
  await expect(dialog).toBeHidden();
});

test("shoppers pick a variant on a collab brand's page", async ({ page }) => {
  await page.goto("/shop");
  await page
    .getByRole("navigation", { name: /marcas/i })
    .getByRole("link", { name: /Baking Stereo/ })
    .first()
    .click();

  await expect(page).toHaveURL(/\/brands\/baking-stereo$/);
  await page.getByRole("button", { name: "Chocolate Chip", exact: true }).click();

  const dialog = page.getByRole("dialog", { name: "Chocolate Chip" });
  const picker = dialog.getByRole("radiogroup");
  await expect(picker.getByRole("radio", { name: /Unidad/ })).toBeChecked();

  await picker.getByRole("radio", { name: /Caja de 6/ }).click();

  await expect(picker.getByRole("radio", { name: /Caja de 6/ })).toBeChecked();
  await expect(dialog).toContainText(/15\s?000/);
});
