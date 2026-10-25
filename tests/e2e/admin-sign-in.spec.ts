import { expect, test, type Page } from "@playwright/test";

const STAFF_EMAIL = "staff@snackyzz.test";
const DEMO_PASSWORD = "snackyzz-demo";

async function signIn(page: Page, email: string, password: string) {
  await page.getByLabel("Correo de administración").fill(email);
  await page.getByLabel("Contraseña de administración").fill(password);
  await page.getByRole("button", { name: "Entrar al panel" }).click();
}

test("visitors without a session are sent from the panel to sign-in", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/admin\/sign-in$/);
  await expect(
    page.getByRole("heading", { level: 2, name: "Hola, equipo Snackyzz." }),
  ).toBeVisible();
});

test("a wrong password shows the generic error and keeps the email", async ({ page }) => {
  await page.goto("/admin/sign-in");

  await signIn(page, STAFF_EMAIL, "not-the-password");

  const signInForm = page.getByRole("form", { name: "Hola, equipo Snackyzz." });
  await expect(signInForm.getByRole("alert")).toHaveText(
    "Correo o contraseña incorrectos. Inténtalo de nuevo.",
  );
  await expect(page.getByLabel("Correo de administración")).toHaveValue(STAFF_EMAIL);
  await expect(page.getByLabel("Contraseña de administración")).toHaveValue("");
  await expect(page).toHaveURL(/\/admin\/sign-in$/);
});

test("an admin signs in, reaches the panel and signs out", async ({ page }) => {
  await page.goto("/admin/sign-in");

  await signIn(page, STAFF_EMAIL, DEMO_PASSWORD);

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { level: 1, name: "Hola, Demo Staff." })).toBeVisible();

  await page.goto("/admin/sign-in");
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByRole("button", { name: "Cerrar sesión" }).click();

  await expect(page).toHaveURL(/\/admin\/sign-in$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/sign-in$/);
});
