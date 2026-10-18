import { seasonalCampaigns } from "../../src/components/seasonal/seasonal-campaigns.ts";
import { seasonalPalettes } from "../../src/components/seasonal/seasonal-palettes.ts";
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import { products as catalogProducts } from "../fixtures/products.ts";


async function capture(page, name) {
  if (process.env.CAPTURE_REVIEW) {
    const directory = process.env.CAPTURE_DIR || ".impeccable/review";
    fs.mkdirSync(directory, { recursive: true });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page
      .locator("img")
      .evaluateAll((images) =>
        Promise.all(images.map((image) => image.decode().catch(() => {}))),
      );
    await page.screenshot({
      path: directory + "/" + name + "-" + test.info().project.name + ".png",
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
const location = {
  id: "00000000-0000-0000-0000-000000000010",
  name: "Tienda Central",
  city: "San José",
  address: "Avenida 1",
  hours: "L-V 9 a 5",
  map_url: "",
  position: 1,
  active: true,
};
const zones = [
  {
    id: "00000000-0000-0000-0000-000000000020",
    name: "Escazú",
    price: 2000,
    active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000021",
    name: "Santa Ana",
    price: 3000,
    active: true,
  },
];
const settings = {
  id: 1,
  demo_catalog: true,
  sinpe_number: "",
  sinpe_recipient: "",
  whatsapp: "+506 8888 8888",
  public_email: "Snackyzz.cookies@gmail.com",
  instagram: "Snackyzz.cookies",
  uber_delivery_enabled: true,
  delivery_lead_hours: 6,
  delivery_slot_hours: 3,
  delivery_schedule: Object.fromEntries(
    ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => [
      day,
      { enabled: true, start: "09:00", end: "18:00" },
    ]),
  ),
  uber_disclaimer:
    "El costo del servicio de mensajería por Uber corre por cuenta del cliente y se paga por separado.",
};
async function mockSupabase(
  page,
  {
    orderFailure = false,
    emailFailure = false,
    isAdmin = true,
    productSaveFailure = false,
    zoneSaveFailure = false,
    rejectFailure = false,
    confirmFailure = false,
    stockOverrides = {},
    seasonalTheme = "original",
    themeSaveFailure = false,
  } = {},
) {
  const products = catalogProducts.map((product,index) => ({...product,active:true,position:index+1,...(product.id in stockOverrides ? {stock:stockOverrides[product.id]} : {})}));
  const calls = [];
  let managedOrder = {...order};
  let storeSettings = {...settings,seasonal_theme:seasonalTheme};
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
    if (path === "/rest/v1/store_settings") return reply(storeSettings);
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
    if (path === "/rest/v1/delivery_zones")
      return reply(zones.filter((zone) => zone.active));
    if (path === "/rest/v1/rpc/is_admin") return reply(isAdmin);
    if (path === "/functions/v1/manage-orders") {
      if (request.method() === "GET") return reply({ orders: [managedOrder] });
      const multipart = request.headers()['content-type']?.includes('multipart/form-data');
      let body;
      if (multipart) {
        const form = await new Response(request.postDataBuffer(),{headers:{'Content-Type':request.headers()['content-type']}}).formData();
        body = {orderId:form.get('orderId'),action:form.get('action'),reason:form.get('reason'),refundReceipt:form.get('refundReceipt')?.name};
      } else body = request.postDataJSON();
      calls.push({ kind: "manage", ...body });
      if (body.action === "confirm" && confirmFailure) return reply({error:"No se pudo confirmar la orden."},503);
      if (body.action === "reject" && rejectFailure) return reply({error:"No se pudo rechazar la orden."},503);
      managedOrder = {
        ...managedOrder,
        status: body.action === "reject" ? "rejected" : body.action === "confirm" ? "confirmed" : managedOrder.status,
        ...(body.action === "confirm" ? {confirmationComment:body.comment ?? ""} : {}),
        confirmedAt: body.action === "confirm" ? "2026-09-07T15:10:00Z" : managedOrder.confirmedAt,
        ...(body.action === "reject" ? {rejectedAt:"2026-10-11T18:00:00Z",rejectionReason:body.reason,...(body.refundReceipt ? {refundReceiptUrl:"/assets/cookie-chocolate.webp"} : {})} : {}),
        emailStatus: emailFailure && body.action !== "retry-email" ? "failed" : "sent",
      };
      return reply({order:managedOrder});
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
      if (productSaveFailure)
        return reply({ error: "No pudimos guardar el producto." }, 503);
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
      if (request.method() === "GET")
        return reply({
          settings:storeSettings,
          locations: [location],
          zones,
          emailConfigured: false,
        });
      const body = request.postDataJSON();
      calls.push({ kind: "store-settings", ...body });
      if(body.action==='save-theme') {
        if(themeSaveFailure) return reply({error:'No se pudo guardar el tema.'},503);
        storeSettings={...storeSettings,seasonal_theme:body.theme};
        return reply({settings:storeSettings});
      }
      if (body.action === "save-zone" && zoneSaveFailure) return reply({ error: "No se pudo guardar la zona." }, 503);
      if (body.action === "save-zone")
        return reply({
          zone: {
            id: body.id || "00000000-0000-0000-0000-000000000022",
            name: body.name,
            price: body.price,
            active: true,
          },
        });
      if (["archive-zone", "restore-zone"].includes(body.action))
        return reply({
          zone: {
            ...zones.find((zone) => zone.id === body.id),
            active: body.action === "restore-zone",
          },
        });
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
  await goToCheckout(page);
  await page.getByLabel("Nombre completo").fill("Cliente de prueba");
  await page
    .getByLabel("Correo electrónico", { exact: true })
    .fill("customer@example.invalid");
  await page.getByLabel("Punto de retiro").selectOption(location.id);
}
async function goToCheckout(page) {
  if (page.viewportSize().width <= 800) {
    await page.locator(".cart-bubble").click();
    await page
      .locator(".cart-sheet")
      .getByRole("link", { name: "Comprar", exact: true })
      .click();
  } else {
    await page
      .locator(".collection-page .cart-column")
      .getByRole("link", { name: "Comprar", exact: true })
      .click();
  }
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
    page.getByRole("heading", {
      name: "Caer en el antojo nunca supo tan bien.",
    }),
  ).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(3);
  await capture(page, "home");
  await page
    .getByRole("button", { name: "Ver detalles de Choco Cloud" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Agregar al carrito", exact: true })
    .click();
  await expect(page.locator("#dialog-quantity output")).toHaveText("1");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(page.locator("[data-cart-count]")).toHaveText("1");
  for (const hash of ["shop", "sales", "about", "checkout", "admin"]) {
    await page.goto("/#" + hash);
    await page.locator("#main").waitFor();
    await capture(page, "route-" + hash);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test("mobile cart opens from the bubble without interrupting shopping", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await mockSupabase(page);
  await page.goto("/#shop");
  const sheet = page.locator(".cart-sheet");
  const bubble = page.locator(".cart-bubble");
  await expect(page.locator(".cart-button")).toBeHidden();
  await expect(bubble).toBeVisible();
  await page.locator(".cart-bubble").click();
  await expect(sheet).toBeVisible();
  await expect(
    sheet.getByRole("link", { name: "Explorar cookies" }),
  ).toBeVisible();
  const bounds = await sheet.boundingBox();
  expect(bounds.x).toBe(0);
  expect(bounds.y).toBe(0);
  expect(bounds.width).toBe(page.viewportSize().width);
  expect(bounds.height).toBe(page.viewportSize().height);
  await page.keyboard.press("Escape");
  await expect(sheet).not.toBeVisible();
  await expect(page.locator(".cart-bubble")).toBeFocused();

  await page
    .getByRole("button", { name: "Ver detalles de Choco Cloud" })
    .click();
  await page
    .locator("#product-dialog")
    .getByRole("button", { name: "Ver mi carrito" })
    .click();
  await expect(sheet).toBeVisible();
  await sheet.getByRole("button", { name: "Cerrar carrito" }).click();

  await page
    .locator(".shop-products .product-card")
    .first()
    .getByRole("button", { name: "Agregar al carrito" })
    .click();
  await expect(sheet).not.toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 900));
  await expect(bubble).toBeVisible();
  await bubble.click();
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText("Choco Cloud");
  await sheet.getByRole("button", { name: "Agregar una Choco Cloud" }).click();
  await expect(page.locator("[data-cart-count]")).toHaveText("2");
  await sheet.getByRole("link", { name: "Comprar" }).click();
  await expect(page).toHaveURL(/#checkout$/);
  await expect(sheet).not.toBeVisible();
  await expect(bubble).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Casi puedes saborearlo." }),
  ).toBeVisible();
});

test("narrow mobile pages do not scroll sideways and the cart fills the viewport", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await mockSupabase(page);
  for (const width of [280, 300]) {
    await page.setViewportSize({ width, height: 700 });
    for (const route of ["home", "shop", "checkout"]) {
      await page.goto(`/#${route}`);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
    }
    await page.goto("/#shop");
    await page.locator(".cart-bubble").click();
    const bounds = await page.locator(".cart-sheet").boundingBox();
    expect(bounds).toMatchObject({ x: 0, y: 0, width, height: 700 });
  }
});

test("cart item scrolling stays clear of prices", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await mockSupabase(page);
  await page.setViewportSize({ width: 390, height: 500 });
  await page.goto("/#shop");
  const cards = page.locator(".shop-products .product-card");
  for (let index = 0; index < 3; index++) {
    await cards
      .nth(index)
      .getByRole("button", { name: "Agregar al carrito" })
      .click();
  }
  await page.locator(".cart-bubble").click();
  const measurements = await page.locator(".cart-sheet").evaluate((sheet) => {
    const list = sheet.querySelector(".cart-lines");
    const amount = sheet.querySelector(".cart-line strong");
    return {
      priceClearance:
        list.getBoundingClientRect().right -
        amount.getBoundingClientRect().right,
      canScroll: list.scrollHeight > list.clientHeight,
      horizontalOverflow: list.scrollWidth > list.clientWidth,
    };
  });
  expect(measurements.priceClearance).toBeGreaterThanOrEqual(12);
  expect(measurements.canScroll).toBe(true);
  expect(measurements.horizontalOverflow).toBe(false);
});

test("desktop cart button keeps the current collection when its cart is visible", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop");
  await mockSupabase(page);
  await page.goto("/#baking-stereo");
  await page.locator(".cart-button").click();
  await expect(page).toHaveURL(/#baking-stereo$/);
  await expect(page.locator(".collection-page .cart-column")).toBeVisible();
  await expect(page.locator(".cart-sheet")).not.toBeVisible();
});
test("receipt is mandatory and success follows persisted API response only", async ({
  page,
}) => {
  const calls = await mockSupabase(page);
  await startCheckout(page);
  await page.getByRole("button", { name: "Realizar pedido" }).click();
  expect(calls).toHaveLength(0);
  await expect(page).toHaveURL(/#checkout$/);
  await attachReceipt(page);
  await capture(page, "checkout");
  await page.getByRole("button", { name: "Realizar pedido" }).click();
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
    name: "Realizar pedido",
  });
  await submit.click();
  await expect(page.locator("#checkout-error")).toContainText(
    "No pudimos guardar",
  );
  await expect(page.getByText("receipt.png", { exact: true })).toBeVisible();
  await expect(page.locator("[data-cart-count]")).toHaveText("1");
  await submit.click();
  await expect(page.locator("#checkout-error")).toContainText(
    "No pudimos guardar",
  );
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
  await expect(page.getByRole("link", { name: "Snackyzz" })).toHaveCount(0);
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
  await page.getByRole("button", { name: "Confirmar y notificar" }).click();
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
  await expect(page.locator(".admin-product-row")).toHaveCount(6);
  await page
    .getByRole("button", { name: "Baking Stereo", exact: true })
    .click();
  await expect(page.locator(".admin-product-row")).toHaveCount(3);
  await expect(page.locator(".admin-product-list")).not.toContainText(
    "Choco Cloud",
  );
  await expect(
    page.getByRole("button", { name: "Baking Stereo", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await capture(page, "admin-brand-filter");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Snackyzz", exact: true }).click();
  await expect(page.locator(".admin-product-row")).toHaveCount(3);
  await expect(page.locator(".admin-product-list")).not.toContainText(
    "Chocolate Chip",
  );
  await page
    .getByRole("button", { name: "Todas las marcas", exact: true })
    .click();
  await expect(page.locator(".admin-product-row")).toHaveCount(6);
  await page.getByRole("button", { name: /Nuevo producto/ }).click();
  await page.getByLabel("Nombre").fill("Caramel Dream");
  await page.getByLabel("Sección del catálogo").selectOption("baking-stereo");
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
  expect(calls.find((call) => call.kind === "product-save").body).toMatch(
    /name="brand"\r\n\r\nbaking-stereo/,
  );
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
    page.getByRole("button", { name: "Realizar pedido" }),
  ).toBeDisabled();
  expect(calls).toHaveLength(0);
  await expect(
    page.getByRole("button", { name: "Realizar pedido" }),
  ).toBeEnabled();
});

test("separate cookie collections share quantities and checkout", async ({
  page,
}) => {
  await mockSupabase(page);
  await page.goto("/#shop");
  await expect(
    page.getByRole("heading", { name: "Snackyzz", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".product-card")).toHaveCount(3);
  await page
    .locator('[data-product="choco-cloud"][data-qty="1"]')
    .first()
    .click();
  await page.locator(".collection-switch a").click();
  await expect(page).toHaveURL(/#baking-stereo$/);
  await expect(page.locator(".product-card")).toHaveCount(3);
  await expect(page.locator(".product-card").first()).toContainText(
    "Baking Stereo · Recién horneadas",
  );
  await page
    .locator('[data-product="bs-chocolate-chip"][data-qty="1"]')
    .first()
    .click();
  await expect(page.locator("[data-cart-count]")).toHaveText("2");
  await expect(page.locator("#main .cart-lines")).toContainText("Choco Cloud");
  await expect(page.locator("#main .cart-lines")).toContainText(
    "Chocolate Chip",
  );
  await page.reload();
  await expect(page.locator("[data-cart-count]")).toHaveText("2");
  await capture(page, "baking-stereo");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.locator(".collection-switch a").click();
  await expect(page.locator("[data-cart-count]")).toHaveText("2");
  await capture(page, "snackyzz-collection");
  await goToCheckout(page);
  await expect(page.locator("#main .cart-brand")).toContainText([
    "Snackyzz · Selladas",
    "Baking Stereo · Recién horneadas",
  ]);
});

test("hash variants, unknown routes, and browser history preserve navigation", async ({
  page,
}) => {
  await mockSupabase(page);
  await page.goto("/#/shop");
  await expect(
    page.getByRole("heading", { name: "Snackyzz", exact: true }),
  ).toBeVisible();
  await page.locator(".collection-switch a").click();
  await expect(page).toHaveURL(/#baking-stereo$/);
  await expect(
    page.getByRole("heading", {
      name: "Snackyzz X Baking Stereo",
      exact: true,
    }),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#\/shop$/);
  await expect(
    page.getByRole("heading", { name: "Snackyzz", exact: true }),
  ).toBeVisible();
  await page.goForward();
  await expect(
    page.getByRole("heading", {
      name: "Snackyzz X Baking Stereo",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/#not-a-route");
  await expect(
    page.getByRole("heading", {
      name: "Caer en el antojo nunca supo tan bien.",
    }),
  ).toBeVisible();
});

test("stored cart hydrates on a direct checkout visit", async ({ page }) => {
  await mockSupabase(page);
  await page.addInitScript(() =>
    localStorage.setItem(
      "snackyzz-cart",
      JSON.stringify({ "choco-cloud": 2, "bs-chocolate-chip": 1, ghost: 9 }),
    ),
  );
  await page.goto("/#checkout");
  await expect(page.locator("[data-cart-count]")).toHaveText("3");
  await expect(page.locator("#main .cart-lines")).toContainText("Choco Cloud");
  await expect(page.locator("#main .cart-lines")).toContainText(
    "Chocolate Chip",
  );
  await expect(page.locator("#main .cart-lines")).not.toContainText("ghost");
});

test("admin session survives reload without changing login flow", async ({
  page,
}) => {
  await mockSupabase(page);
  await page.goto("/#admin");
  await page
    .getByLabel("Correo de administración")
    .fill("admin@example.invalid");
  await page
    .getByLabel("Contraseña de administración")
    .fill("test-only-not-a-real-password");
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await expect(page.getByRole("heading", { name: "Órdenes." })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Órdenes." })).toBeVisible();
  await page
    .getByRole("button", { name: "Configuración", exact: true })
    .click();
  await capture(page, "admin-settings");
  await page.getByRole("button", { name: "Productos", exact: true }).click();
  await page
    .locator(".admin-product-row")
    .first()
    .getByRole("button", { name: "Editar" })
    .click();
  await capture(page, "admin-editor");
  await page
    .getByRole("button", { name: "Cerrar sesión", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Hola, equipo Snackyzz." }),
  ).toBeVisible();
});

test("authenticated non-admin cannot access management", async ({ page }) => {
  await mockSupabase(page, { isAdmin: false });
  await page.goto("/#admin");
  await page
    .getByLabel("Correo de administración")
    .fill("customer@example.invalid");
  await page
    .getByLabel("Contraseña de administración")
    .fill("test-only-not-a-real-password");
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await expect(
    page.getByText("Esta cuenta no tiene acceso de administración."),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Órdenes." })).toHaveCount(0);
});

test("keyboard cart controls retain focus and dialog appearance", async ({
  page,
}) => {
  await mockSupabase(page);
  await page.goto("/#shop");
  const add = page.locator(
    '.product-card [data-product="choco-cloud"][data-qty="1"]',
  );
  await add.focus();
  await page.keyboard.press("Enter");
  await expect(add).toBeFocused();
  await page
    .getByRole("button", { name: "Ver detalles de Choco Cloud" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await capture(page, "product-dialog");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("catalog failure displays the existing error and retries", async ({
  page,
}) => {
  await mockSupabase(page);
  await page.route(/\/rest\/v1\/products\?/, (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ message: "unavailable" }),
    }),
  );
  await page.goto("/#shop");
  await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
  await page.unroute(/\/rest\/v1\/products\?/);
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(page.getByRole("button", { name: "Reintentar" })).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Agregar al carrito" }).first(),
  ).toBeVisible();
});

test("expired admin session with a rejected refresh returns to login", async ({
  page,
}) => {
  await mockSupabase(page);
  await page.goto("/#admin");
  await page
    .getByLabel("Correo de administración")
    .fill("admin@example.invalid");
  await page
    .getByLabel("Contraseña de administración")
    .fill("test-only-not-a-real-password");
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await expect(page.getByRole("heading", { name: "Órdenes." })).toBeVisible();
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find(
      (key) => key.startsWith("sb-") && key.endsWith("-auth-token"),
    );
    const session = JSON.parse(localStorage.getItem(key));
    session.expires_at = 1;
    localStorage.setItem(key, JSON.stringify(session));
  });
  await page.route(/\/auth\/v1\/token\?/, (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        code: "refresh_token_not_found",
        message: "Invalid Refresh Token: Refresh Token Not Found",
      }),
    }),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Hola, equipo Snackyzz." }),
  ).toBeVisible();
});

test("admin manages SINPE and requires payment details before leaving demo mode", async ({
  page,
}) => {
  const calls = await mockSupabase(page);
  await page.goto("/#admin");
  await page
    .getByLabel("Correo de administración")
    .fill("admin@example.invalid");
  await page
    .getByLabel("Contraseña de administración")
    .fill("test-only-not-a-real-password");
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await expect(page.getByRole("heading", { name: "Órdenes." })).toBeVisible();
  await page
    .getByRole("button", { name: "Configuración", exact: true })
    .click();
  await expect(page.getByLabel("Modo de prueba")).toBeChecked();
  await page.getByLabel("Modo de prueba").uncheck();
  await page.getByRole("button", { name: "Guardar configuración" }).click();
  expect(calls.filter((call) => call.kind === "store-settings")).toHaveLength(
    0,
  );
  await expect(page.getByLabel("Número SINPE")).toHaveAttribute("required", "");
  await page.getByLabel("Número SINPE").fill("88888888");
  await page.getByLabel("Destinatario SINPE").fill("Test recipient");
  await page.getByRole("button", { name: "Guardar configuración" }).click();
  await expect
    .poll(() => calls.filter((call) => call.kind === "store-settings").length)
    .toBe(1);
  expect(calls.find((call) => call.kind === "store-settings")).toMatchObject({
    action: "save-settings",
    demoCatalog: false,
    sinpeNumber: "88888888",
    sinpeRecipient: "Test recipient",
  });
});

test("cookie editor preserves draft through refresh and failed save", async ({
  page,
}) => {
  await mockSupabase(page, { productSaveFailure: true });
  await page.goto("/#admin");
  await page
    .getByLabel("Correo de administración")
    .fill("admin@example.invalid");
  await page
    .getByLabel("Contraseña de administración")
    .fill("test-only-not-a-real-password");
  await page.getByRole("button", { name: "Entrar al panel" }).click();
  await expect(page.getByRole("heading", { name: "Órdenes." })).toBeVisible();
  await page.getByRole("button", { name: "Productos", exact: true }).click();
  await page
    .locator(".admin-product-row")
    .first()
    .getByRole("button", { name: "Editar", exact: true })
    .click();
  await page.getByLabel("Nombre", { exact: true }).fill("Edited cookie");
  await page
    .getByLabel("Descripción", { exact: true })
    .fill("My unsaved description");
  await page.getByRole("button", { name: "Actualizar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Actualizar", exact: true }),
  ).toBeEnabled();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue(
    "Edited cookie",
  );
  await expect(page.getByLabel("Descripción", { exact: true })).toHaveValue(
    "My unsaved description",
  );
  await page
    .getByRole("button", { name: "Guardar producto", exact: true })
    .click();
  await expect(page.locator("#main").getByRole("alert")).toContainText(
    "No pudimos guardar el producto.",
  );
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue(
    "Edited cookie",
  );
  await expect(page.getByLabel("Descripción", { exact: true })).toHaveValue(
    "My unsaved description",
  );
  await page.getByRole("button", { name: "Cerrar editor" }).click();
  await page
    .locator(".admin-product-row")
    .first()
    .getByRole("button", { name: "Editar", exact: true })
    .click();
  await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue(
    "Choco Cloud",
  );
});

test("delivery zones update the payable total and disappear for pickup", async ({
  page,
}) => {
  await mockSupabase(page);
  await startCheckout(page);
  await expect(page.getByLabel("Zona", { exact: true })).toHaveCount(0);
  await page.getByLabel("Enviar con mensajero").check();
  await page.getByLabel("Zona", { exact: true }).selectOption(zones[0].id);
  await expect(
    page.locator("#main .cart-total").filter({ hasText: "Total a pagar" }),
  ).toContainText("4 500");
  await page.getByLabel("Zona", { exact: true }).selectOption(zones[1].id);
  await expect(
    page.locator("#main .cart-total").filter({ hasText: "Total a pagar" }),
  ).toContainText("5 500");
  await capture(page, "delivery-zones-checkout");
  await page.getByLabel("Retiro", { exact: false }).first().check();
  await expect(page.getByLabel("Zona", { exact: true })).toHaveCount(0);
  await expect(
    page.locator("#main .cart-total").filter({ hasText: "Total a pagar" }),
  ).toHaveCount(0);
});

test("admin can add edit and deactivate delivery zones", async ({ page }) => {
  const calls = await mockSupabase(page);
  await page.goto("/#admin");
  await page
    .getByLabel("Correo de administración")
    .fill("admin@example.invalid");
  await page
    .getByLabel("Contraseña de administración")
    .fill("testing-password");
  await page
    .getByRole("button", { name: "Entrar al panel", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Configuración", exact: true })
    .click();
  await page.getByRole("button", { name: "Nueva zona", exact: true }).click();
  await page.getByLabel("Nombre de la zona").fill("San José");
  await page.getByLabel("Precio de envío (₡)").fill("1500");
  await page.getByRole("button", { name: "Guardar zona", exact: true }).click();
  await expect(page.locator(".delivery-zones-admin")).toContainText("San José");
  const row = page
    .locator(".delivery-zones-admin article")
    .filter({ hasText: "San José" });
  await row.getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByLabel("Precio de envío (₡)").fill("1800");
  await page.getByRole("button", { name: "Guardar zona", exact: true }).click();
  await expect(row).toContainText("1 800");
  await page
    .locator(".delivery-zones-admin article")
    .filter({ hasText: "Escazú" })
    .getByRole("button", { name: "Desactivar", exact: true })
    .click();
  await expect(
    page.locator(".delivery-zones-admin article").filter({ hasText: "Escazú" }),
  ).toContainText("Inactiva");
  expect(
    calls
      .filter((call) => call.action === "save-zone")
      .map((call) => call.price),
  ).toEqual([1500, 1800]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await capture(page, "delivery-zones-admin");
});

test("delivery submission requires a zone and sends its id without a client fee", async ({page}) => {
  const calls = await mockSupabase(page);
  await startCheckout(page);
  await page.getByLabel("Enviar con mensajero").check();
  await page.getByLabel("Dirección de entrega").fill("San José, Avenida 1, casa 2");
  await page.getByLabel("Fecha de entrega").selectOption({index:2});
  await page.getByLabel("Horario de entrega").selectOption({index:1});
  await attachReceipt(page);
  await page.getByRole("button", {name:"Realizar pedido",exact:true}).click();
  expect(calls.filter(call => call.kind === "create")).toHaveLength(0);
  await page.getByLabel("Zona", {exact:true}).selectOption(zones[0].id);
  await page.getByRole("button", {name:"Realizar pedido",exact:true}).click();
  await expect(page.getByRole("heading", {name:"¡Pedido realizado con éxito!"})).toBeVisible();
  const request = calls.find(call => call.kind === "create");
  expect(request.body).toContain('name="deliveryZoneId"');
  expect(request.body).toContain(zones[0].id);
  expect(request.body).not.toContain('name="deliveryFee"');
});

test("zone save failure keeps the draft and spaces actions", async ({page}) => {
  await mockSupabase(page, {zoneSaveFailure:true});
  await page.goto("/#admin");
  await page.getByLabel("Correo de administración").fill("admin@example.invalid");
  await page.getByLabel("Contraseña de administración").fill("testing-password");
  await page.getByRole("button", {name:"Entrar al panel"}).click();
  await page.getByRole("button", {name:"Configuración",exact:true}).click();
  await page.getByRole("button", {name:"Nueva zona",exact:true}).click();
  await page.getByLabel("Nombre de la zona").fill("San José");
  await page.getByLabel("Precio de envío (₡)").fill("1500");
  await page.getByRole("button",{name:"Guardar zona",exact:true}).click();
  await expect(page.locator(".delivery-zones-admin")).toContainText("No se pudo guardar la zona.");
  await expect(page.getByLabel("Nombre de la zona")).toHaveValue("San José");
  await expect(page.getByLabel("Precio de envío (₡)")).toHaveValue("1500");
  const save = await page.getByRole("button",{name:"Guardar zona",exact:true}).boundingBox();
  const cancel = await page.getByRole("button",{name:"Cancelar",exact:true}).boundingBox();
  expect(Math.max(cancel.x - (save.x + save.width), cancel.y - (save.y + save.height))).toBeGreaterThanOrEqual(15);
  await capture(page,"zone-editor-actions");
});

async function openAdminOrder(page) {
  await page.goto("/#admin");
  await page.getByLabel("Correo de administración").fill("admin@example.invalid");
  await page.getByLabel("Contraseña de administración").fill("testing-password");
  await page.getByRole("button",{name:"Entrar al panel",exact:true}).click();
  await page.getByRole("button",{name:/Revisar pedido SN-TEST/}).click();
}
test("admin requires a rejection reason and can retry the rejection email", async ({page}) => {
  const calls = await mockSupabase(page,{emailFailure:true});
  await openAdminOrder(page);
  await page.getByRole("button",{name:"Rechazar",exact:true}).click();
  await page.getByRole("button",{name:"Rechazar y notificar",exact:true}).click();
  expect(calls).toHaveLength(0);
  const reason = "El comprobante no coincide con el monto del pedido.";
  await page.getByLabel("Motivo del rechazo",{exact:true}).fill(reason);
  await capture(page,"order-rejection-form");
  await page.getByRole("button",{name:"Rechazar y notificar",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Pedido rechazado",exact:true})).toBeVisible();
  await expect(page.locator(".rejection-reason")).toHaveText(reason);
  await expect(page.getByRole("button",{name:"Confirmar pedido",exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:"Reintentar correo",exact:true}).click();
  await expect(page.getByText("Correo enviado",{exact:true})).toBeVisible();
  expect(calls.map(call => call.action)).toEqual(["reject","retry-email"]);
  expect(calls[0].reason).toBe(reason);
  await page.getByRole("button",{name:"Rechazadas",exact:true}).click();
  await expect(page.locator(".orders-list .status")).toHaveText("Rechazado");
});
test("rejection save failure preserves the reason and order state", async ({page}) => {
  await mockSupabase(page,{rejectFailure:true});
  await openAdminOrder(page);
  await page.getByRole("button",{name:"Rechazar",exact:true}).click();
  const reason = "No podemos entregar en el horario solicitado.";
  await page.getByLabel("Motivo del rechazo",{exact:true}).fill(reason);
  await page.getByRole("button",{name:"Rechazar y notificar",exact:true}).click();
  await expect(page.locator(".order-rejection-form")).toContainText("No se pudo rechazar la orden.");
  await expect(page.getByLabel("Motivo del rechazo",{exact:true})).toHaveValue(reason);
  await page.getByRole("button",{name:"Cancelar",exact:true}).click();
  await expect(page.getByRole("button",{name:"Confirmar pedido",exact:true})).toBeVisible();
  await expect(page.locator(".orders-list .status")).toHaveText("Pendiente");
});

test("admin attaches a refund receipt and keeps it on email retry", async ({page}) => {
  const calls = await mockSupabase(page,{emailFailure:true});
  await openAdminOrder(page);
  await page.getByRole('button',{name:'Rechazar',exact:true}).click();
  await page.getByLabel('Motivo del rechazo',{exact:true}).fill('Devolvimos el pago porque no hay disponibilidad.');
  await page.locator('#refund-receipt').setInputFiles({name:'devolucion.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=','base64')});
  await expect(page.getByAltText('Vista previa del comprobante de devolución SINPE')).toBeVisible();
  await capture(page,'refund-receipt-form');
  await page.getByRole('button',{name:'Rechazar y notificar',exact:true}).click();
  await expect(page.getByAltText('Comprobante de devolución SINPE',{exact:true})).toBeVisible();
  expect(calls[0].refundReceipt).toBe('devolucion.png');
  await page.getByRole('button',{name:'Reintentar correo',exact:true}).click();
  await expect(page.getByText('Correo enviado',{exact:true})).toBeVisible();
  await expect(page.getByAltText('Comprobante de devolución SINPE',{exact:true})).toBeVisible();
});
test("refund upload rejects unsupported files without submitting", async ({page}) => {
  const calls = await mockSupabase(page);
  await openAdminOrder(page);
  await page.getByRole('button',{name:'Rechazar',exact:true}).click();
  await page.locator('#refund-receipt').setInputFiles({name:'receipt.pdf',mimeType:'application/pdf',buffer:Buffer.from('invalid')});
  await expect(page.getByText('Adjunta una imagen JPG o PNG de hasta 5 MB.',{exact:true})).toBeVisible();
  await expect(page.getByAltText('Vista previa del comprobante de devolución SINPE')).toHaveCount(0);
  expect(calls).toHaveLength(0);
});

test("stock limits product quantities and marks unavailable cookies", async ({page}) => {
  await mockSupabase(page,{stockOverrides:{'choco-cloud':2,'double-choco':0}});
  await page.goto('/#shop');
  const cookie = page.locator('.product-card').filter({has:page.getByRole('heading',{name:'Choco Cloud',exact:true})});
  const empty = page.locator('.product-card').filter({has:page.getByRole('heading',{name:'Double Choco',exact:true})});
  await expect(empty.getByRole('button',{name:'Agotado',exact:true})).toBeDisabled();
  await cookie.getByRole('button',{name:'Agregar al carrito',exact:true}).click();
  await cookie.locator('[data-qty="1"]').click();
  await expect(cookie.getByLabel('Cantidad',{exact:true})).toHaveText('2');
  await expect(cookie.locator('[data-qty="1"]')).toBeDisabled();
  await capture(page,'inventory-store');
});
test("admin can set available stock when creating a product", async ({page}) => {
  const calls = await mockSupabase(page);
  await page.goto('/#admin');
  await page.getByLabel('Correo de administración',{exact:true}).fill('admin@example.invalid');
  await page.getByLabel('Contraseña de administración',{exact:true}).fill('test-password');
  await page.getByRole('button',{name:'Entrar al panel',exact:true}).click();
  await page.getByRole('button',{name:'Productos',exact:true}).click();
  await page.getByRole('button',{name:/Nuevo producto/}).click();
  await expect(page.getByLabel('Stock disponible',{exact:true})).toHaveValue('0');
  await page.getByLabel('Stock disponible',{exact:true}).fill('24');
  await expect(page.getByLabel('Stock disponible',{exact:true})).toHaveValue('24');
  expect(calls.filter(c=>c.kind==='product-save')).toHaveLength(0);
  await capture(page,'inventory-admin');
  await page.getByLabel('Nombre',{exact:true}).fill('Caramel Dream');
  await page.getByLabel('Precio (₡)',{exact:true}).fill('3100');
  await page.getByLabel('Etiqueta corta',{exact:true}).fill('Cookie');
  await page.getByLabel('Descripción',{exact:true}).fill('Cookie de caramelo.');
  await page.getByLabel('Imagen',{exact:true}).setInputFiles('tests/fixtures/receipt.png');
  await page.getByRole('button',{name:'Guardar producto',exact:true}).click();
  await expect(page.getByText('Caramel Dream',{exact:true})).toBeVisible();
  expect(calls.find(c=>c.kind==='product-save').body).toMatch(/name="stock"\r?\n\r?\n24/);
});

test("confirmation comment is saved and preserved when retrying email", async ({page}) => {
  const calls = await mockSupabase(page,{emailFailure:true});
  await openAdminOrder(page);
  await page.getByRole('button',{name:'Confirmar pedido',exact:true}).click();
  expect(calls).toHaveLength(0);
  const comment = 'Tu pedido llegará mañana entre 2 y 4 p. m.';
  await page.getByLabel('Comentario para el cliente (opcional)',{exact:true}).fill(comment);
  await capture(page,'confirmation-comment-form');
  await page.getByRole('button',{name:'Confirmar y notificar',exact:true}).click();
  await expect(page.locator('.confirmation-comment')).toHaveText(comment);
  expect(calls[0].comment).toBe(comment);
  await page.getByRole('button',{name:'Reintentar correo',exact:true}).click();
  await expect(page.getByText('Correo enviado',{exact:true})).toBeVisible();
  await expect(page.locator('.confirmation-comment')).toHaveText(comment);
});
test("confirmation failure keeps the comment and cancellation leaves the order pending", async ({page}) => {
  const calls = await mockSupabase(page,{confirmFailure:true});
  await openAdminOrder(page);
  await page.getByRole('button',{name:'Confirmar pedido',exact:true}).click();
  const field=page.getByLabel('Comentario para el cliente (opcional)',{exact:true});
  await field.fill('Pasaremos a las 3 p. m.');
  await page.getByRole('button',{name:'Confirmar y notificar',exact:true}).click();
  await expect(page.locator('.order-confirmation-form')).toContainText('No se pudo confirmar la orden.');
  await expect(field).toHaveValue('Pasaremos a las 3 p. m.');
  await page.getByRole('button',{name:'Cancelar',exact:true}).click();
  await expect(page.locator('.orders-list .status')).toHaveText('Pendiente');
  expect(calls).toHaveLength(1);
});
test("empty Baking Stereo is hidden and returns when an active product is added", async ({page}) => {
  await mockSupabase(page);
  let available = false;
  await page.route(/https:\/\/[^/]+\.supabase\.co\/rest\/v1\/products(?:\?|$)/,route => route.fulfill({
    status:200,contentType:'application/json',body:JSON.stringify(catalogProducts.filter(product=>available || product.brand!=='baking-stereo').map(product=>({...product,stock:0}))),
  }));
  await page.goto('/#baking-stereo');
  await expect(page).toHaveURL(/#shop$/);
  await expect(page.locator('a[href="#baking-stereo"]')).toHaveCount(0);
  await expect(page.locator('.baking-hero')).toHaveCount(0);
  await capture(page,'empty-collaboration-hidden');
  available = true;
  await page.reload();
  await expect(page.locator('.site-footer a[href="#baking-stereo"]')).toBeVisible();
  await page.locator('.site-footer a[href="#baking-stereo"]').click();
  await expect(page.getByRole('heading',{name:'Love at first bite',exact:true})).toBeVisible();
  available = false;
  await page.reload();
  await expect(page).toHaveURL(/#shop$/);
  await expect(page.locator('a[href="#baking-stereo"]')).toHaveCount(0);
});

test("seasonal preview is private and each theme stays out of Baking Stereo", async ({page}) => {
 const calls=await mockSupabase(page);
 for(const theme of ['valentines','easter','halloween','thanksgiving','christmas','new-year']) {
  await page.goto(`/?themePreview=${theme}`);
  await expect(page.locator('#app').locator('..')).toHaveAttribute('data-season',theme);
  await expect(page.locator('.season-decor--hero')).toBeVisible();
  const campaign=seasonalCampaigns[theme];
  await expect(page.locator('.hero h1')).toHaveText(`${campaign.headline} ${campaign.emphasis}`);
  await expect(page.locator('.hero .button-orange')).toHaveText(campaign.cta);
  await expect(page.locator('.hero-visual > img')).toHaveAttribute('src',campaign.image);
  await expect.poll(()=>page.locator('.hero-visual > img').evaluate(image=>image.naturalWidth)).toBeGreaterThan(0);
  const palette=seasonalPalettes[theme];
  const rgb=hex=>'rgb('+hex.match(/[a-f0-9]{2}/gi).map(value=>parseInt(value,16)).join(', ')+')';
  await expect(page.locator('#app').locator('..')).toHaveCSS('background-color',rgb(palette.canvas));
  await expect(page.locator('.hero .button-orange')).toHaveCSS('background-color',rgb(palette.action));
  await expect(page.locator('.hero .button-orange')).toHaveCSS('color',rgb(palette.onAction));
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await capture(page,`season-${theme}`);
  await page.goto(`/?themePreview=${theme}#baking-stereo`);
  await expect(page.getByRole('heading',{name:'Love at first bite',exact:true})).toBeVisible();
  await expect(page.locator('#app').locator('..')).toHaveAttribute('data-season','original');
  await expect(page.locator('.season-decor--header')).toHaveCount(0);
  expect(await page.locator('#app').locator('..').evaluate(el=>getComputedStyle(el).getPropertyValue('--cream').trim())).toBe('#f9ede0');
  await expect(page.locator('.season-preview-banner')).toHaveCount(0);
 }
 expect(calls).toHaveLength(0);
 await page.goto('/?themePreview=not-real');
 await expect(page.locator('#app').locator('..')).toHaveAttribute('data-season','original');
 await expect(page.locator('.season-preview-banner')).toHaveCount(0);
});
test("admin previews, publishes and removes a seasonal theme", async ({page,context}) => {
 const calls=await mockSupabase(page);
 await page.goto('/#admin');
 await page.getByLabel('Correo de administración').fill('admin@example.invalid');
 await page.getByLabel('Contraseña de administración').fill('test-password');
 await page.getByRole('button',{name:'Entrar al panel'}).click();
 await page.getByRole('button',{name:'Configuración',exact:true}).click();
 const season=page.locator('.season-admin');
 await page.getByLabel('WhatsApp con código de país',{exact:true}).fill('+506 7777 9999');
 await season.getByLabel('Temporada',{exact:true}).selectOption('christmas');
 expect((await season.locator('.season-shell').boundingBox()).height).toBeLessThan(350);
 await expect(season.getByRole('status')).toContainText('Tema publicado: Original Snackyzz');
 const [preview]=await Promise.all([context.waitForEvent('page'),season.getByRole('link',{name:/Vista previa/}).click()]);
 await expect(preview).toHaveURL(/themePreview=christmas/);
 await preview.close();
 expect(calls.filter(c=>c.action==='save-theme')).toHaveLength(0);
 await capture(page,'season-admin');
 await season.getByRole('button',{name:'Aplicar tema',exact:true}).click();
 await expect(season.getByRole('status')).toContainText('Tema publicado: Navidad');
 await expect(page.getByLabel('WhatsApp con código de país',{exact:true})).toHaveValue('+506 7777 9999');
 await page.goto('/#shop');
 await expect(page.locator('#app').locator('..')).toHaveAttribute('data-season','christmas');
 await expect(page.locator('.season-decor--hero')).toHaveCount(0);
 await page.goto('/#admin');
 await page.getByRole('button',{name:'Configuración',exact:true}).click();
 await season.getByLabel('Temporada',{exact:true}).selectOption('original');
 await season.getByRole('button',{name:'Aplicar tema',exact:true}).click();
 await expect(season.getByRole('status')).toContainText('Tema publicado: Original Snackyzz');
 expect(calls.filter(c=>c.action==='save-theme').map(c=>c.theme)).toEqual(['christmas','original']);
});
test("failed theme save preserves the published theme and the chosen preview", async ({page}) => {
 await mockSupabase(page,{themeSaveFailure:true});
 await page.goto('/#admin');
 await page.getByLabel('Correo de administración').fill('admin@example.invalid');
 await page.getByLabel('Contraseña de administración').fill('test-password');
 await page.getByRole('button',{name:'Entrar al panel'}).click();
 await page.getByRole('button',{name:'Configuración',exact:true}).click();
 const season=page.locator('.season-admin');
 await season.getByLabel('Temporada',{exact:true}).selectOption('halloween');
 await season.getByRole('button',{name:'Aplicar tema',exact:true}).click();
 await expect(season.getByRole('alert')).toBeVisible();
 await expect(season.getByLabel('Temporada',{exact:true})).toHaveValue('halloween');
 await expect(season.getByRole('status')).toContainText('Tema publicado: Original Snackyzz');
});

test("leaving seasonal checkout preview preserves customer input", async ({page}) => {
 await mockSupabase(page);
 await page.goto('/?themePreview=christmas#shop');
 await page.getByRole('button',{name:'Agregar al carrito',exact:true}).first().click();
 await goToCheckout(page);
 await page.getByLabel('Nombre completo',{exact:true}).fill('Nombre conservado');
 await page.getByRole('button',{name:'Salir de vista previa',exact:true}).click();
 await expect(page.getByLabel('Nombre completo',{exact:true})).toHaveValue('Nombre conservado');
 await expect(page.locator('.season-preview-banner')).toHaveCount(0);
 await expect(page).not.toHaveURL(/themePreview/);
});

test("seasonal quantity controls keep readable foreground and background on hover",async({page})=>{
 await mockSupabase(page);
 await page.goto('/?themePreview=christmas#shop');
 const card=page.locator('.product-card').first();
 await card.getByRole('button',{name:'Agregar al carrito',exact:true}).click();
 const plus=card.locator('.stepper button[data-qty="1"]');
 await plus.hover();
 const palette=seasonalPalettes.christmas;
 const rgb=hex=>'rgb('+hex.match(/[a-f0-9]{2}/gi).map(value=>parseInt(value,16)).join(', ')+')';
 await expect(plus).toHaveCSS('background-color',rgb(palette.action));
 await expect(plus).toHaveCSS('color',rgb(palette.onAction));
});
