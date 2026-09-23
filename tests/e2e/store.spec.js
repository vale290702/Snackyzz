import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { products } from "../../src/data/products.js";

async function capture(page, name) {
  if (process.env.CAPTURE_REVIEW) {
    fs.mkdirSync(".impeccable/review", { recursive: true });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path:
        ".impeccable/review/" + name + "-" + test.info().project.name + ".png",
      fullPage: true,
    });
  }
}
const order = {
  id: "SN-TEST-1001",
  name: "Cliente de prueba",
  email: "customer@example.invalid",
  phone: "88888888",
  items: [
    { productId: "choco-cloud", name: "Choco Cloud", price: 2500, quantity: 1 },
  ],
  total: 2500,
  status: "pending",
  createdAt: "2026-09-07T15:00:00Z",
  confirmedAt: null,
  emailStatus: "not_sent",
  receiptUrl: "/assets/choco-cloud.webp",
  fulfillmentType: "pickup",
  fulfillmentLabel: "Tienda Central",
  fulfillmentAddress: "Avenida 1, San José",
};
const location = { id:"00000000-0000-0000-0000-000000000010", name:"Tienda Central", city:"San José", address:"Avenida 1", hours:"L-V 9 a 5", map_url:"", position:1, active:true };
const settings = { id:1,demo_catalog:true,sinpe_number:"",sinpe_recipient:"",whatsapp:"+506 8888 8888",public_email:"Snackyzz.cookies@gmail.com",instagram:"Snackyzz.cookies",uber_delivery_enabled:true,uber_disclaimer:"El costo del servicio de mensajería por Uber corre por cuenta del cliente y se paga por separado." };
async function mockSupabase(
  page,
  { orderFailure = false, emailFailure = false } = {},
) {
  const calls = [];
  await page.route("https://*.supabase.co/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const reply = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(body),
      });
    if (path === "/rest/v1/products") return reply(products);
    if (path === "/rest/v1/sales_points") return reply([location]);
    if (path === "/rest/v1/store_settings")
      return reply(settings);
    if (path === "/functions/v1/create-order") {
      calls.push({
        kind: "create",
        key: request.headers()["idempotency-key"],
        body: request.postData(),
      });
      return orderFailure
        ? reply(
            { error: "No pudimos guardar el comprobante. Inténtalo de nuevo." },
            503,
          )
        : reply({ order }, 201);
    }
    if (path === "/auth/v1/token") {
      const token = [
        { alg: "HS256", typ: "JWT" },
        {
          sub: "00000000-0000-0000-0000-000000000001",
          exp: Math.floor(Date.now() / 1000) + 3600,
          role: "authenticated",
        },
        "test",
      ]
        .map((x) =>
          typeof x === "string"
            ? x
            : Buffer.from(JSON.stringify(x)).toString("base64url"),
        )
        .join(".");
      return reply({
        access_token: token,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "test-refresh",
        user: {
          id: "00000000-0000-0000-0000-000000000001",
          email: "admin@example.invalid",
          aud: "authenticated",
        },
      });
    }
    if (path === "/rest/v1/rpc/is_admin") return reply(true);
    if (path === "/functions/v1/manage-orders") {
      if (request.method() === "GET") return reply({ orders: [order] });
      const body = request.postDataJSON();
      calls.push({ kind: "manage", ...body });
      return reply({
        order: {
          ...order,
          status: "confirmed",
          confirmedAt: "2026-09-07T15:10:00Z",
          emailStatus:
            emailFailure && body.action === "confirm" ? "failed" : "sent",
        },
      });
    }
    if (path === "/functions/v1/manage-products") {
      if (request.method() === "GET") return reply({ products });
      const contentType = request.headers()["content-type"] || "";
      if (contentType.includes("application/json")) {
        const body = request.postDataJSON();
        calls.push({ kind: "product-action", ...body });
        const product = products.find((item) => item.id === body.productId);
        return reply({
          product: { ...product, active: body.action === "restore" },
        });
      }
      calls.push({ kind: "product-save", body: request.postData() });
      return reply({
        product: {
          ...products[0],
          id: "caramel-dream-test",
          name: "Caramel Dream",
          price: 3100,
          position: 4,
          active: true,
        },
      });
    }
    if (path === "/functions/v1/manage-store") {
      if (request.method() === "GET") return reply({ settings, locations:[location], emailConfigured:false });
      return reply({ settings });
    }
    if (path === "/auth/v1/logout") return reply({});
    return reply({ error: "Unmocked endpoint: " + path }, 404);
  });
  return calls;
}
async function startCheckout(page) {
  await page.goto("/#shop");
  await expect(page.getByText("No pudimos cargar el catálogo.")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Agregar al carrito" })
    .first()
    .click();
  await page.getByRole("link", { name: "Comprar", exact: true }).click();
  await page.getByLabel("Nombre completo").fill("Cliente de prueba");
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill("customer@example.invalid");
  await page.getByLabel("Punto de retiro").selectOption(location.id);
}
async function attachReceipt(page) {
  // Valid PNG fixture encoded locally; no real payment or customer information.
  await page.locator("#receipt").setInputFiles("tests/fixtures/receipt.png");
  await expect(page.getByText("receipt.png", { exact: true })).toBeVisible();
}
test("store is responsive, cart persists, and product dialog supports keyboard close", async ({
  page,
}) => {
  await mockSupabase(page);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Un antojo. Tres formas de caer." }),
  ).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(3);
  await page
    .getByRole("button", { name: "Ver detalles de Choco Cloud" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Agregar una cookie" }).click();
  await expect(page.locator("#dialog-quantity output")).toHaveText("1");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(page.locator("[data-cart-count]")).toHaveText("1");
  for (const hash of ["shop", "sales", "about", "checkout", "admin"]) {
    await page.goto("/#" + hash);
    await page.locator("#main").waitFor();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test("receipt is mandatory and success follows persisted API response only", async ({
  page,
}) => {
  const calls = await mockSupabase(page);
  await startCheckout(page);
  await page
    .getByRole("button", { name: "Registrar pedido de prueba" })
    .click();
  expect(calls).toHaveLength(0);
  await expect(page).toHaveURL(/#checkout$/);
  await attachReceipt(page);
  await capture(page, "checkout");
  await page
    .getByRole("button", { name: "Registrar pedido de prueba" })
    .click();
  await expect(
    page.getByRole("heading", { name: "¡Pedido realizado con éxito!" }),
  ).toBeVisible();
  await capture(page, "success");
  expect(calls).toHaveLength(1);
  expect(calls[0].key).toBeTruthy();
  expect(calls[0].body).toContain('name="receipt"');
  await expect(page.locator("[data-cart-count]")).toHaveText("0");
  await expect(
    page.getByText("Pendiente de revisión", { exact: true }),
  ).toBeVisible();
});
test("failed order preserves the receipt/cart and reuses its idempotency key", async ({
  page,
}) => {
  const calls = await mockSupabase(page, { orderFailure: true });
  await startCheckout(page);
  await attachReceipt(page);
  const submit = page.getByRole("button", {
    name: "Registrar pedido de prueba",
  });
  await submit.click();
  await expect(page.getByRole("alert")).toContainText("No pudimos guardar");
  await expect(page.getByText("receipt.png", { exact: true })).toBeVisible();
  await expect(page.locator("[data-cart-count]")).toHaveText("1");
  await submit.click();
  await expect(page.getByRole("alert")).toContainText("No pudimos guardar");
  expect(calls).toHaveLength(2);
  expect(calls[0].key).toEqual(calls[1].key);
});
test("admin reviews the receipt, confirms an order, and can retry a failed email", async ({
  page,
}) => {
  const calls = await mockSupabase(page, { emailFailure: true });
  await page.goto("/#admin");
  await expect(
    page.getByRole("navigation", { name: "Navegación principal" }),
  ).toHaveCount(0);
  await expect(page.getByRole("link", { name: /carrito/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Las cookies" })).toHaveCount(0);
  await page
    .getByLabel("Correo de administración")
    .fill("admin@example.invalid");
  await page
    .getByLabel("Contraseña de administración")
    .fill("test-only-not-a-real-password");
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await expect(page.getByRole("heading", { name: "Órdenes." })).toBeVisible();
  await page.getByRole("button", { name: /Revisar pedido SN-TEST/ }).click();
  await expect(
    page.getByRole("img", { name: /Comprobante SINPE/ }),
  ).toBeVisible();
  await capture(page, "admin");
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await expect(
    page.getByText("No se pudo enviar el correo", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reintentar correo" }).click();
  await expect(page.getByText("Correo enviado", { exact: true })).toBeVisible();
  expect(calls.map((x) => x.action)).toEqual(["confirm", "retry-email"]);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(
    page.getByRole("heading", { name: "Hola, equipo Snackyzz." }),
  ).toBeVisible();
});

test("admin creates and archives database products", async ({ page }) => {
  const calls = await mockSupabase(page);
  await page.goto("/#admin");
  await page
    .getByLabel("Correo de administración")
    .fill("admin@example.invalid");
  await page
    .getByLabel("Contraseña de administración")
    .fill("test-only-not-a-real-password");
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await page.getByRole("button", { name: "Productos" }).click();
  await expect(page.getByRole("heading", { name: "Productos." })).toBeVisible();
  await expect(page.locator(".admin-product-row")).toHaveCount(3);
  await page.getByRole("button", { name: /Nuevo producto/ }).click();
  await page.getByLabel("Nombre").fill("Caramel Dream");
  await page.getByLabel("Precio (₡)").fill("3100");
  await page.getByLabel("Posición").fill("4");
  await page.getByLabel("Etiqueta corta").fill("Edición dulce");
  await page.getByLabel("Descripción").fill("Cookie suave con caramelo.");
  await page.getByLabel("Imagen").setInputFiles("tests/fixtures/receipt.png");
  await page.getByRole("button", { name: "Guardar producto" }).click();
  await expect(page.getByText("Caramel Dream", { exact: true })).toBeVisible();
  await page
    .locator('.admin-product-row:has-text("Caramel Dream")')
    .getByRole("button", { name: "Archivar" })
    .click();
  expect(calls.some((call) => call.kind === "product-save")).toBe(true);
  expect(
    calls.some(
      (call) => call.kind === "product-action" && call.action === "archive",
    ),
  ).toBe(true);
});
test("checkout waits for replacement image validation instead of sending a stale receipt", async ({
  page,
}) => {
  const calls = await mockSupabase(page);
  await startCheckout(page);
  await attachReceipt(page);
  await page.evaluate(() => {
    const original = window.createImageBitmap;
    window.createImageBitmap = async (...args) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return original(...args);
    };
  });
  await page.locator("#receipt").setInputFiles("tests/fixtures/receipt.png");
  await expect(
    page.getByRole("button", { name: "Registrar pedido de prueba" }),
  ).toBeDisabled();
  expect(calls).toHaveLength(0);
  await expect(
    page.getByRole("button", { name: "Registrar pedido de prueba" }),
  ).toBeEnabled();
});
