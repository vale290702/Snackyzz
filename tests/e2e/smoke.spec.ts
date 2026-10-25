import { expect, test } from "@playwright/test";

test("home page renders the brand heading", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: "Snackyzz" })).toBeVisible();
});

test("unknown routes show the not-found page", async ({ page }) => {
  await page.goto("/this-page-does-not-exist");

  await expect(page.getByRole("link", { name: "Volver al inicio" })).toBeVisible();
});
