import "./styles.css";
import { products as previewProducts } from "./data/products.js";
import { createCartStore } from "./lib/cart.js";
import { api } from "./lib/api.js";
import { configured, supabase } from "./lib/supabase.js";
import { escapeHtml as e, safeImage } from "./lib/html.js";
import { getRouteFromHash, navigateTo } from "./lib/router.js";
import {
  renderNav,
  renderFooter,
  icon,
  quantityControl,
} from "./components/ui.js";
import { renderHome } from "./pages/home.js";
import { renderShop } from "./pages/shop.js";
import { renderSales } from "./pages/sales.js";
import { renderAbout } from "./pages/about.js";
import { renderCheckout, renderSuccess } from "./pages/checkout.js";
import { createAdminController, renderAdmin } from "./pages/admin.js";

const app = document.querySelector("#app");
const dialog = document.querySelector("#product-dialog");
const toast = document.querySelector("#toast");
let cart = createCartStore({ products: previewProducts });
const state = {
  products: previewProducts,
  salesPoints: [],
  selectedCity: "Todos",
  demoCatalog: true,
  payment: { configured: false, number: "", recipient: "" },
  contact: { whatsapp: "", email: "Snackyzz.cookies@gmail.com", instagram: "Snackyzz.cookies" },
  delivery: { uberEnabled: true, disclaimer: "El costo del servicio de mensajería corre por cuenta del cliente y se paga por separado.", leadHours: 6, slotHours: 3, schedule: {} },
  fulfillment: { type: "pickup", pickupLocationId: "", deliveryAddress: "", deliveryDate: "", deliverySlotStart: "" },
  catalogReady: false,
  catalogError: "",
  activePage: getRouteFromHash(),
  draft: { name: "", email: "", phone: "" },
  receipt: null,
  receiptPreview: "",
  validatingReceipt: false,
  checkoutError: "",
  submitting: false,
  lastOrder: null,
  idempotencyKey: "",
  detailId: null,
};
let toastTimer;
let receiptValidationVersion = 0;
const admin = createAdminController({ render: renderPage, notify });
function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toastTimer = setTimeout(() => {
    toast.textContent = "";
  }, 5000);
}

function renderPage() {
  const focused = document.activeElement;
  const focusId = focused?.id;
  const selection = focused?.selectionStart;
  const qtyFocus = focused?.matches("[data-qty]")
    ? { id: focused.dataset.product, qty: focused.dataset.qty }
    : null;
  state.activePage = getRouteFromHash();
  const props = { ...state, cart };
  const views = {
    home: () => renderHome(props),
    shop: () => renderShop(props),
    sales: () => renderSales(props),
    about: renderAbout,
    checkout: () => renderCheckout(props),
    success: () => renderSuccess(props),
    admin: () => renderAdmin(admin.state),
  };
  const notice = state.catalogError
    ? `<div class="app-notice" role="status">${e(state.catalogError)} <button data-reload-catalog>Reintentar</button></div>`
    : !configured
      ? '<div class="app-notice">Vista previa · Los pedidos estarán disponibles cuando se conecte la tienda.</div>'
      : "";
  app.innerHTML =
    state.activePage === "admin"
      ? views.admin()
      : renderNav({
          activePage: state.activePage,
          cartCount: cart.getCount(),
        }) +
        notice +
        views[state.activePage]() +
        renderFooter(state.contact);
  document.title =
    {
      home: "Un antojo. Tres formas de caer.",
      shop: "Las cookies",
      sales: "Dónde encontrarnos",
      checkout: "Completa tu pedido",
      success: "Pedido recibido",
      admin: "Administración",
      about: "Sobre nosotros",
    }[state.activePage] + " | Snackyzz";
  if (focusId) {
    const target = document.getElementById(focusId);
    target?.focus({ preventScroll: true });
    if (typeof selection === "number" && target?.type === "search")
      target.setSelectionRange(selection, selection);
  } else if (qtyFocus) {
    document
      .querySelector(
        `[data-product="${CSS.escape(qtyFocus.id)}"][data-qty="${qtyFocus.qty}"]:not(:disabled)`,
      )
      ?.focus({ preventScroll: true });
  }
}
async function loadCatalog() {
  if (!configured) return;
  state.catalogError = "";
  try {
    const catalog = await api("/catalog");
    Object.assign(state, catalog, { catalogReady: true });
    if (!catalog.salesPoints.length && catalog.delivery.uberEnabled) state.fulfillment.type = "uber";
    cart = createCartStore({ products: catalog.products });
  } catch (error) {
    state.catalogReady = false;
    state.catalogError = error.message;
  }
  if (getRouteFromHash() !== "admin") renderPage();
}
function routeChanged() {
  if (dialog.open) dialog.close();
  renderPage();
  window.scrollTo({ top: 0, behavior: "instant" });
  document.querySelector("#main")?.focus({ preventScroll: true });
  if (state.activePage === "admin" && !admin.state.loaded) void admin.load();
}
function renderProductDialog(id) {
  const p = state.products.find((p) => p.id === id);
  if (!p) return;
  state.detailId = id;
  dialog.innerHTML = `<div class="dialog-layout"><button class="icon-button dialog-close" data-close-dialog aria-label="Cerrar detalles">${icon("close")}</button><img class="dialog-photo" src="${e(safeImage(p.image))}" alt="${e(p.name)}, imagen de referencia" width="640" height="640"><div class="dialog-copy"><h2 id="dialog-title">${e(p.name)}</h2><p>${e(p.description)}</p><p class="dialog-price">${new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 }).format(p.price)}</p><div id="dialog-quantity">${quantityControl(p, cart.getQuantity(id))}</div><button class="button button-dark wide" data-dialog-add="${e(id)}">Agregar una cookie ${icon("plus")}</button><a href="#shop" class="button button-outline wide" data-close-dialog>Ver mi carrito ${icon("bag")}</a>${state.demoCatalog ? '<p class="demo-notice">Producto e imagen de referencia. Consulta ingredientes y alérgenos antes de comprar.</p>' : ""}</div></div>`;
  if (!dialog.open) dialog.showModal();
}
function quantityChanged(button) {
  const id = button.dataset.product,
    change = Number(button.dataset.qty);
  cart.changeQuantity(id, change);
  state.idempotencyKey = "";
  renderPage();
  if (dialog.open) {
    const p = state.products.find((p) => p.id === state.detailId);
    document.querySelector("#dialog-quantity").innerHTML = quantityControl(
      p,
      cart.getQuantity(p.id),
    );
    dialog.querySelector(`[data-qty="${change}"]:not(:disabled)`)?.focus();
  }
  const p = state.products.find((p) => p.id === id);
  notify(
    change > 0
      ? `${p.name} agregada. ${cart.getCount()} cookies en tu carrito.`
      : `Carrito actualizado. ${cart.getCount()} cookies.`,
  );
  document.querySelector(".cart-button")?.classList.add("bag-nudge");
}
document.addEventListener("click", async (event) => {
  const target = event.target.closest("button,a");
  if (!target) return;
  if (target.getAttribute("href") === "#main") {
    event.preventDefault();
    document.querySelector("#main")?.focus();
    return;
  }
  if (
    state.submitting &&
    target.tagName === "A" &&
    target.getAttribute("href")?.startsWith("#")
  ) {
    event.preventDefault();
    notify("Estamos registrando tu pedido. Espera un momento.");
    return;
  }
  if (target.matches("[data-menu]")) {
    const menu = document.querySelector(".mobile-nav");
    menu.hidden = !menu.hidden;
    target.setAttribute("aria-expanded", String(!menu.hidden));
    return;
  }
  if (target.matches("[data-close-dialog]")) dialog.close();
  if (target.matches("[data-detail]"))
    renderProductDialog(target.dataset.detail);
  if (target.matches("[data-qty]")) quantityChanged(target);
  if (target.matches("[data-dialog-add]"))
    quantityChanged({
      dataset: { product: target.dataset.dialogAdd, qty: "1" },
    });
  if (target.matches("[data-clear]")) {
    cart.clear();
    state.idempotencyKey = "";
    renderPage();
    notify("Carrito vacío.");
  }
  if (target.matches("[data-city]")) {
    state.selectedCity = target.dataset.city;
    renderPage();
  }
  if (target.matches("[data-reload-catalog]")) await loadCatalog();
  if (target.matches("[data-copy-sinpe]")) {
    try {
      await navigator.clipboard.writeText(state.payment.number);
      notify("Número SINPE copiado.");
    } catch {
      notify("No se pudo copiar. Selecciona el número SINPE y cópialo.");
    }
  }
  if (target.matches("[data-admin-refresh]")) await admin.load();
  if (target.matches("[data-admin-logout]")) await admin.logout();
  if (target.matches("[data-admin-view]")) {
    admin.state.view = target.dataset.adminView;
    admin.state.selected = null;
    admin.state.editingProduct = null;
    renderPage();
  }
  if (target.matches("[data-product-filter]")) {
    admin.state.productFilter = target.dataset.productFilter;
    renderPage();
  }
  if (target.matches("[data-new-product]")) {
    admin.state.editingProduct = "new";
    renderPage();
  }
  if (target.matches("[data-new-location]")) {
    admin.state.editingLocation = "new";
    renderPage();
  }
  if (target.matches("[data-edit-location]")) {
    admin.state.editingLocation = target.dataset.editLocation;
    renderPage();
  }
  if (target.matches("[data-close-location]")) {
    admin.state.editingLocation = null;
    renderPage();
  }
  if (target.matches("[data-location-action]")) {
    await admin.storeAction({ action: `${target.dataset.locationAction}-location`, id: target.dataset.locationId }, target.dataset.locationAction === "archive" ? "Punto archivado." : "Punto restaurado.");
    await loadCatalog();
  }
  if (target.matches("[data-edit-product]")) {
    admin.state.editingProduct = target.dataset.editProduct;
    renderPage();
  }
  if (target.matches("[data-close-product]")) {
    admin.state.editingProduct = null;
    renderPage();
  }
  if (target.matches("[data-archive-product]"))
    await admin.productAction(target.dataset.archiveProduct, "archive");
  if (target.matches("[data-restore-product]"))
    await admin.productAction(target.dataset.restoreProduct, "restore");
  if (target.matches("[data-order-filter]")) {
    admin.state.filter = target.dataset.orderFilter;
    admin.state.selected = null;
    renderPage();
  }
  if (target.matches("[data-order]")) {
    admin.state.selected = target.dataset.order;
    renderPage();
    document
      .querySelector(".order-detail")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  if (target.matches("[data-close-order]")) {
    admin.state.selected = null;
    renderPage();
  }
  if (target.matches("[data-confirm-order]"))
    await admin.action(target.dataset.confirmOrder, "confirm");
  if (target.matches("[data-retry-email]"))
    await admin.action(target.dataset.retryEmail, "retry-email");
});
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      dialog.close();
  }
});
dialog.addEventListener("close", () => {
  state.detailId = null;
});
document.addEventListener("input", (event) => {
  if (
    event.target.closest("#checkout-form") &&
    ["name", "email", "phone"].includes(event.target.name)
  ) {
    state.draft[event.target.name] = event.target.value;
    state.idempotencyKey = "";
  }
  if (event.target.id === "order-search") {
    admin.state.search = event.target.value;
    renderPage();
  }
  if (event.target.id === "delivery-address") {
    state.fulfillment.deliveryAddress = event.target.value;
    state.idempotencyKey = "";
  }
  if (event.target.id === "delivery-date") {
    state.fulfillment.deliveryDate = event.target.value;
    state.fulfillment.deliverySlotStart = "";
    state.idempotencyKey = "";
    renderPage();
  }
});
document.addEventListener("change", async (event) => {
  if (event.target.name === "fulfillmentType") {
    state.fulfillment.type = event.target.value;
    state.idempotencyKey = "";
    renderPage();
    return;
  }
  if (event.target.id === "pickup-location") {
    state.fulfillment.pickupLocationId = event.target.value;
    state.idempotencyKey = "";
    renderPage();
    return;
  }
  if (event.target.id === "delivery-slot") {
    state.fulfillment.deliverySlotStart = event.target.value;
    state.idempotencyKey = "";
    renderPage();
    return;
  }
  if (event.target.id !== "receipt") return;
  const file = event.target.files?.[0];
  if (!file) return;
  const validationVersion = ++receiptValidationVersion;
  if (state.receiptPreview) URL.revokeObjectURL(state.receiptPreview);
  state.receipt = null;
  state.receiptPreview = "";
  state.idempotencyKey = "";
  state.validatingReceipt = true;
  renderPage();
  let error = "";
  if (!["image/jpeg", "image/png"].includes(file.type))
    error = "Selecciona una imagen JPG o PNG del comprobante.";
  else if (file.size > 5 * 1024 * 1024)
    error = "La imagen supera 5 MB. Usa una imagen más pequeña.";
  else if (!file.size)
    error = "La imagen está vacía. Selecciona otro comprobante.";
  else {
    try {
      const bitmap = await createImageBitmap(file);
      bitmap.close();
    } catch {
      error = "No pudimos leer la imagen. Selecciona otro JPG o PNG.";
    }
  }
  if (validationVersion !== receiptValidationVersion) return;
  state.validatingReceipt = false;
  if (error) {
    if (state.receiptPreview) URL.revokeObjectURL(state.receiptPreview);
    state.receipt = null;
    state.receiptPreview = "";
    state.idempotencyKey = "";
    state.checkoutError = error;
    renderPage();
    return;
  }
  if (state.receiptPreview) URL.revokeObjectURL(state.receiptPreview);
  state.receipt = file;
  state.receiptPreview = URL.createObjectURL(file);
  state.checkoutError = "";
  state.idempotencyKey = "";
  renderPage();
});
document.addEventListener("submit", async (event) => {
  if (event.target.id === "admin-login-form") {
    event.preventDefault();
    const fields = new FormData(event.target);
    await admin.login(fields.get("email"), fields.get("password"));
    return;
  }
  if (event.target.matches("#product-form")) {
    event.preventDefault();
    await admin.saveProduct(new FormData(event.target));
    await loadCatalog();
    return;
  }
  if (event.target.id === "store-settings-form") {
    event.preventDefault();
    const fields = new FormData(event.target);
    const schedule = Object.fromEntries(["mon","tue","wed","thu","fri","sat","sun"].map((day) => [day, { enabled: fields.has(`delivery_${day}_enabled`), start: fields.get(`delivery_${day}_start`), end: fields.get(`delivery_${day}_end`) }]));
    await admin.storeAction({
      action: "save-settings",
      sinpeNumber: fields.get("sinpeNumber"), sinpeRecipient: fields.get("sinpeRecipient"),
      whatsapp: fields.get("whatsapp"), publicEmail: fields.get("publicEmail"), instagram: fields.get("instagram"),
      uberDeliveryEnabled: fields.has("uberDeliveryEnabled"), uberDisclaimer: fields.get("uberDisclaimer"),
      deliveryLeadHours: Number(fields.get("deliveryLeadHours")), deliverySlotHours: Number(fields.get("deliverySlotHours")), deliverySchedule: schedule,
    }, "Configuración guardada.");
    await loadCatalog();
    return;
  }
  if (event.target.id === "location-form") {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.target));
    await admin.storeAction({ action: "save-location", ...fields, position: Number(fields.position) }, "Punto de retiro guardado.");
    await loadCatalog();
    return;
  }
  if (event.target.id !== "checkout-form") return;
  event.preventDefault();
  if (state.submitting || state.validatingReceipt) return;
  if (!state.receipt) {
    state.checkoutError = "Adjunta tu comprobante SINPE para continuar.";
    renderPage();
    return;
  }
  if (!state.catalogReady) {
    state.checkoutError =
      "No pudimos cargar la tienda. Reintenta la conexión antes de enviar tu pedido.";
    renderPage();
    return;
  }
  const body = new FormData();
  for (const [key, value] of Object.entries(state.draft))
    body.set(key, value.trim());
  body.set(
    "items",
    JSON.stringify(
      cart
        .getLines()
        .map(({ product, quantity }) => ({ productId: product.id, quantity })),
    ),
  );
  body.set("receipt", state.receipt);
  body.set("fulfillmentType", state.fulfillment.type);
  body.set("pickupLocationId", state.fulfillment.pickupLocationId);
  body.set("deliveryAddress", state.fulfillment.deliveryAddress.trim());
  body.set("deliveryDate", state.fulfillment.deliveryDate);
  body.set("deliverySlotStart", state.fulfillment.deliverySlotStart);
  state.idempotencyKey ||= crypto.randomUUID();
  state.submitting = true;
  state.checkoutError = "";
  renderPage();
  try {
    const { order } = await api("/orders", {
      method: "POST",
      body,
      headers: { "Idempotency-Key": state.idempotencyKey },
    });
    if (!order?.id)
      throw Error(
        "No pudimos confirmar el registro. Intenta enviar el pedido de nuevo.",
      );
    state.lastOrder = {
      ...order,
      email: state.draft.email.trim(),
      demo: state.demoCatalog,
    };
    cart.clear();
    state.draft = { name: "", email: "", phone: "" };
    state.fulfillment = { type: state.salesPoints.length ? "pickup" : "uber", pickupLocationId: "", deliveryAddress: "", deliveryDate: "", deliverySlotStart: "" };
    state.receipt = null;
    URL.revokeObjectURL(state.receiptPreview);
    state.receiptPreview = "";
    state.idempotencyKey = "";
    admin.state.loaded = false;
    navigateTo("success");
  } catch (error) {
    state.checkoutError = error.message;
  } finally {
    state.submitting = false;
    renderPage();
    if (state.checkoutError)
      document
        .querySelector("#checkout-error")
        ?.scrollIntoView({ block: "center" });
  }
});
globalThis.addEventListener("hashchange", routeChanged);
globalThis.addEventListener("beforeunload", (event) => {
  if (state.submitting) {
    event.preventDefault();
    event.returnValue = "";
  }
});
supabase?.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") admin.reset();
});
renderPage();
void loadCatalog();
if (state.activePage === "admin") void admin.load();
