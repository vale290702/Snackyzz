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
  await expect(
    page
      .getByRole("navigation", { name: "Secciones de administración" })
      .getByRole("link", { name: "Productos" }),
  ).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: "Editar Choco Cloud" }).click();
  const editor = page.getByRole("dialog", { name: "Editar producto" });
  await expect(editor.getByLabel("Nombre", { exact: true })).toHaveValue("Choco Cloud");
  await expect(editor.getByLabel("Nombre de la presentación")).toHaveValue("Unidad");
  await expect(editor.getByLabel("Precio (₡)")).toHaveValue("2500");
});

test("the editor opens above the list and restores its trigger", async ({ page }) => {
  await signInAs(page, "owner@snackyzz.test");
  await page.goto("/admin/catalog");

  await expect(page.getByRole("radio", { name: "Activos", exact: true })).toBeChecked();
  const trigger = page.getByRole("button", { name: "Nuevo producto" });
  await trigger.click();

  const title = page.getByRole("heading", { level: 2, name: "Nuevo producto" });
  await expect(title).toBeInViewport();
  const editor = page.getByRole("dialog", { name: "Nuevo producto" });
  await expect(editor.getByRole("button", { name: "Cerrar editor" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(editor).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("the owner creates a sellable product and protects unsaved changes", async ({
  page,
}, testInfo) => {
  const name = `E2E cookie ${testInfo.project.name} ${Date.now()}`;
  await signInAs(page, "owner@snackyzz.test");
  await page.goto("/admin/catalog");
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  const create = page.getByRole("dialog", { name: "Nuevo producto" });
  await create.getByLabel("Nombre", { exact: true }).fill(name);
  await expect(create.getByLabel("Dirección en la tienda")).toHaveAttribute("readonly", "");
  await expect(create.getByLabel("Dirección en la tienda")).toHaveValue(
    name.toLowerCase().replaceAll(" ", "-"),
  );
  await create.getByLabel("Precio (₡)").fill("4200");
  await create.getByLabel("Descripción", { exact: true }).fill("Cookie de prueba de interfaz.");
  await create.getByRole("radio", { name: "Chocolate", exact: true }).check();
  await expect(create.getByLabel("Código hexadecimal")).toHaveValue("#3C1907");
  await create.getByLabel("Código hexadecimal").fill("#123456");
  await create.getByText("Más opciones", { exact: true }).click();
  await create.getByLabel("Buscar categorías").fill("Clásicas");
  await create.getByRole("checkbox", { name: "Clásicas", exact: true }).check();
  await create.getByLabel("Buscar categorías").fill("No existe esta categoría");
  await expect(create.getByRole("status")).toHaveText("No hay categorías con ese nombre.");
  await create.getByRole("button", { name: "Guardar producto" }).click();
  await expect(create).toBeHidden();
  await expect(page.getByText("Cambios guardados", { exact: true })).toBeVisible();
  const trigger = page.getByRole("button", { name: `Editar ${name}`, exact: true });
  await expect(trigger).toBeVisible();
  await page.goto("/shop");
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page.goto("/admin/catalog");
  await trigger.click();
  const editor = page.getByRole("dialog", { name: "Editar producto" });
  await expect(editor.getByLabel("Precio (₡)")).toHaveValue("4200");
  await expect(editor.getByLabel("Código hexadecimal")).toHaveValue("#123456");
  await editor.getByText("Más opciones", { exact: true }).click();
  await editor.getByLabel("Buscar categorías").fill("Clásicas");
  await expect(editor.getByRole("checkbox", { name: "Clásicas", exact: true })).toBeChecked();
  await editor.getByLabel("Precio (₡)").fill("4300");
  await editor.getByRole("button", { name: "Cerrar editor" }).click();
  const discard = page.getByRole("alertdialog", { name: "¿Descartar los cambios?" });
  await discard.getByRole("button", { name: "Seguir editando" }).click();
  await expect(editor.getByRole("button", { name: "Cerrar editor" })).toBeFocused();
  await expect(editor.getByLabel("Precio (₡)")).toHaveValue("4300");
  await page.keyboard.press("Escape");
  await discard.getByRole("button", { name: "Descartar cambios", exact: true }).click();
  await expect(editor).toBeHidden();
  await expect(trigger).toBeFocused();
  const row = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name, exact: true }) });
  await row.getByRole("button", { name: "Archivar", exact: true }).click();
  await page
    .getByRole("dialog", { name: `¿Archivar ${name}?` })
    .getByRole("button", { name: "Sí, archivar" })
    .click();
  await expect(trigger).toHaveCount(0);
});

test("the owner reorders categories with keyboard buttons and keeps the order after reload", async ({
  page,
}, testInfo) => {
  const suffix = `${testInfo.project.name} ${Date.now()}`;
  const names = [`E2E orden A ${suffix}`, `E2E orden B ${suffix}`];
  await signInAs(page, "owner@snackyzz.test");
  await page.goto("/admin/catalog");
  await page.getByRole("tab", { name: "Categorías", exact: true }).click();
  for (const name of names) {
    await page.getByRole("button", { name: "Nueva categoría", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Nueva categoría" });
    await editor.getByLabel("Nombre", { exact: true }).fill(name);
    await editor.getByRole("button", { name: "Guardar categoría", exact: true }).click();
    await expect(editor).toBeHidden();
  }
  const [firstName, secondName] = names as [string, string];
  const down = page.getByRole("button", { name: `Bajar ${firstName}`, exact: true });
  await expect(down).toBeEnabled();
  await down.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: `Subir ${firstName}`, exact: true })).toBeEnabled();
  await expect
    .poll(async () => {
      const order = await page.getByRole("heading", { level: 3 }).allTextContents();
      return order.indexOf(firstName) > order.indexOf(secondName);
    })
    .toBe(true);
  await page.reload();
  await page.getByRole("tab", { name: "Categorías", exact: true }).click();
  const order = await page.getByRole("heading", { level: 3 }).allTextContents();
  expect(order.indexOf(firstName)).toBeGreaterThan(order.indexOf(secondName));
  for (const name of names) {
    const row = page
      .getByRole("listitem")
      .filter({ has: page.getByRole("heading", { name, exact: true }) });
    await row.getByRole("button", { name: "Archivar", exact: true }).click();
    await page
      .getByRole("dialog", { name: `¿Archivar ${name}?` })
      .getByRole("button", { name: "Sí, archivar" })
      .click();
    await expect(page.getByRole("button", { name: `Editar ${name}`, exact: true })).toHaveCount(0);
  }
});

test("the owner adds a second presentation without losing product edits", async ({
  page,
}, testInfo) => {
  const name = `E2E presentaciones ${testInfo.project.name} ${Date.now()}`;
  await signInAs(page, "owner@snackyzz.test");
  await page.goto("/admin/catalog");
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  const create = page.getByRole("dialog", { name: "Nuevo producto" });
  await create.getByLabel("Nombre", { exact: true }).fill(name);
  await create.getByLabel("Precio (₡)").fill("4000");
  await create.getByLabel("Descripción", { exact: true }).fill("Prueba de presentaciones.");
  await create.getByRole("button", { name: "Guardar producto" }).click();
  await expect(create).toBeHidden();
  await page.getByRole("button", { name: `Editar ${name}`, exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Editar producto" });
  await editor.getByLabel("Precio (₡)").fill("4100");
  await editor.getByRole("button", { name: "Nueva presentación", exact: true }).click();
  await expect(editor.getByRole("alert")).toContainText("Guarda los cambios del producto");
  await expect(editor.getByLabel("Precio (₡)")).toHaveValue("4100");
  await editor.getByRole("button", { name: "Guardar producto" }).click();
  await expect(editor).toBeHidden();
  await page.getByRole("button", { name: `Editar ${name}`, exact: true }).click();
  await editor.getByRole("button", { name: "Nueva presentación", exact: true }).click();
  const presentation = editor.getByRole("form", { name: "Nueva presentación" });
  await presentation.getByLabel("Nombre", { exact: true }).fill("Caja de 6");
  await presentation.getByLabel("Precio (₡)").fill("22000");
  await presentation.getByRole("button", { name: "Guardar presentación" }).click();
  await expect(presentation).toBeHidden();
  await expect(editor.getByRole("region", { name: "Presentaciones" })).toContainText("Caja de 6");
  await expect(editor.getByLabel("Nombre de la presentación")).toHaveCount(0);
  await editor.getByRole("button", { name: "Cerrar editor" }).click();
  await expect(editor).toBeHidden();
  const row = page
    .getByRole("listitem")
    .filter({ has: page.getByRole("heading", { name, exact: true }) });
  await row.getByRole("button", { name: "Archivar", exact: true }).click();
  await page
    .getByRole("dialog", { name: `¿Archivar ${name}?` })
    .getByRole("button", { name: "Sí, archivar" })
    .click();
  await expect(page.getByRole("button", { name: `Editar ${name}`, exact: true })).toHaveCount(0);
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
  const card = page
    .getByRole("article")
    .filter({ has: page.getByRole("heading", { name: "Chocolate Chip", exact: true }) });
  await expect(card).toContainText("Desde");
  await expect(card).toContainText("2 presentaciones");
  const trigger = card.getByRole("button", { name: "Elegir presentación" });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Chocolate Chip" });
  const picker = dialog.getByRole("radiogroup");
  await expect(picker.getByRole("radio", { name: /Unidad/ })).toBeChecked();

  await picker.getByRole("radio", { name: /Unidad/ }).click();
  // Radix selects on asynchronous focus while the arrow key is held.
  await page.keyboard.down("ArrowDown");

  await expect(picker.getByRole("radio", { name: /Caja de 6/ })).toBeChecked();
  await page.keyboard.up("ArrowDown");
  await expect(dialog).toContainText(/15\s?000/);
  await expect(dialog.getByRole("button", { name: "Agregar al carrito" })).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});
