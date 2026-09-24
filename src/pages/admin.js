import { productBrand, productBrandLabel } from "../lib/collections.js";
import { api } from "../lib/api.js";
import { escapeHtml as e, safeImage } from "../lib/html.js";
import { formatMoney } from "../lib/cart.js";
import { icon, wordmark } from "../components/ui.js";

const date = (value) =>
  value
    ? new Intl.DateTimeFormat("es-CR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "";
const emailLabels = {
  not_sent: "Se enviará al confirmar",
  pending: "Correo en espera",
  sending: "Enviando correo",
  sent: "Correo enviado",
  failed: "No se pudo enviar el correo",
  unknown: "Envío por verificar con el proveedor",
};
export function createAdminController({ render, notify }) {
  const state = {
    authenticated: false,
    loaded: false,
    loading: true,
    busy: false,
    orders: [],
    products: [],
    settings: null,
    locations: [],
    emailConfigured: false,
    editingLocation: null,
    view: "orders",
    productFilter: "all",
    productBrandFilter: "all",
    editingProduct: null,
    filter: "pending",
    search: "",
    selected: null,
    error: "",
  };
  let revision = 0;
  function reset() {
    revision++;
    Object.assign(state, {
      authenticated: false,
      loaded: false,
      loading: false,
      busy: false,
      orders: [],
      products: [],
      editingProduct: null,
      selected: null,
      error: "",
    });
    render();
  }
  function rejectSession(error) {
    if ([401, 403].includes(error.status)) reset();
    state.error = error.message;
  }
  async function load() {
    const requestRevision = revision;
    state.loading = true;
    state.error = "";
    render();
    try {
      const session = await api("/admin/session");
      if (requestRevision !== revision) return;
      if (!session.authenticated) {
        reset();
        state.loaded = true;
        return;
      }
      const [{ orders }, { products }, store] = await Promise.all([
        api("/admin/orders"),
        api("/admin/products"),
        api("/admin/store"),
      ]);
      if (requestRevision !== revision) return;
      state.authenticated = true;
      state.orders = orders;
      state.products = products;
      state.settings = store.settings;
      state.locations = store.locations;
      state.emailConfigured = store.emailConfigured;
      state.loaded = true;
    } catch (error) {
      if (requestRevision === revision) rejectSession(error);
    } finally {
      if (requestRevision === revision) {
        state.loading = false;
        render();
      }
    }
  }
  async function login(email, password) {
    const requestRevision = revision;
    state.busy = true;
    state.error = "";
    render();
    try {
      await api("/admin/login", { body: { email, password } });
      const [{ orders }, { products }, store] = await Promise.all([
        api("/admin/orders"),
        api("/admin/products"),
        api("/admin/store"),
      ]);
      if (requestRevision !== revision) return;
      state.authenticated = true;
      state.orders = orders;
      state.products = products;
      state.settings = store.settings;
      state.locations = store.locations;
      state.emailConfigured = store.emailConfigured;
      state.loaded = true;
    } catch (error) {
      state.error = error.message;
    } finally {
      state.busy = false;
      render();
    }
  }
  async function logout() {
    try {
      await api("/admin/logout");
      reset();
    } catch (error) {
      notify(error.message);
    }
  }
  async function action(id, action) {
    if (state.busy) return;
    const requestRevision = revision;
    state.busy = true;
    state.error = "";
    render();
    try {
      const result = await api(
        `/admin/orders/${encodeURIComponent(id)}/${action}`,
      );
      if (requestRevision !== revision) return;
      const index = state.orders.findIndex((o) => o.id === id);
      if (index !== -1) state.orders[index] = result.order;
      notify(
        result.order.emailStatus === "sent"
          ? "Orden confirmada. Correo enviado."
          : ["failed", "sending"].includes(result.order.emailStatus)
            ? "Orden confirmada. El correo no se pudo enviar; puedes reintentarlo."
            : "Estado de la orden actualizado.",
      );
    } catch (error) {
      if (requestRevision === revision) rejectSession(error);
    } finally {
      if (requestRevision === revision) {
        state.busy = false;
        render();
      }
    }
  }
  async function saveProduct(body) {
    if (state.busy) return;
    state.view = "products";
    state.busy = true;
    state.error = "";
    render();
    try {
      const { product } = await api("/admin/products/save", { body });
      const index = state.products.findIndex((item) => item.id === product.id);
      if (index === -1) state.products.push(product);
      else state.products[index] = product;
      state.products.sort((a, b) => a.position - b.position);
      state.editingProduct = null;
      notify("Producto guardado.");
    } catch (error) {
      rejectSession(error);
    } finally {
      state.busy = false;
      render();
    }
  }
  async function productAction(id, action) {
    if (state.busy) return;
    state.view = "products";
    state.busy = true;
    state.error = "";
    render();
    try {
      const { product } = await api(
        `/admin/products/${encodeURIComponent(id)}/${action}`,
      );
      const index = state.products.findIndex((item) => item.id === product.id);
      if (index !== -1) state.products[index] = product;
      state.editingProduct = null;
      notify(
        action === "archive" ? "Producto archivado." : "Producto restaurado.",
      );
    } catch (error) {
      rejectSession(error);
    } finally {
      state.busy = false;
      render();
    }
  }
  async function storeAction(body, message) {
    if (state.busy) return;
    state.busy = true;
    state.error = "";
    render();
    try {
      const result = await api("/admin/store/action", { body });
      if (result.settings) state.settings = result.settings;
      if (result.location) {
        const index = state.locations.findIndex((item) => item.id === result.location.id);
        if (index === -1) state.locations.push(result.location);
        else state.locations[index] = result.location;
        state.locations.sort((a, b) => a.position - b.position);
      }
      state.editingLocation = null;
      notify(message);
    } catch (error) {
      rejectSession(error);
    } finally {
      state.busy = false;
      render();
    }
  }
  return {
    state,
    load,
    login,
    logout,
    action,
    saveProduct,
    productAction,
    storeAction,
    reset,
  };
}
export function renderAdmin(state) {
  if (state.loading && !state.authenticated)
    return `${adminNav(state)}<main id="main" class="page-width centered-page inner-page" tabindex="-1"><span class="spinner"></span><p>Cargando administración…</p></main>`;
  if (!state.authenticated)
    return `${adminNav(state)}<main id="main" class="page-width admin-login-page" tabindex="-1"><div class="admin-welcome"><h1>Detrás de<br>cada <em>antojo.</em></h1><p>El espacio para revisar pedidos<br>y dar el siguiente paso.</p></div><form id="admin-login-form" class="login-form">${icon("lock")}<h2>Hola, equipo Snackyzz.</h2><p>Ingresa para gestionar tus órdenes.</p><div class="field"><label for="admin-email">Correo de administración</label><input id="admin-email" name="email" type="email" autocomplete="username" required></div><div class="field"><label for="admin-password">Contraseña de administración</label><input id="admin-password" name="password" type="password" autocomplete="current-password" required ${state.busy ? "disabled" : ""}></div>${state.error ? `<p class="checkout-message" role="alert">${e(state.error)}</p>` : ""}<button class="button button-dark wide" ${state.busy ? "disabled" : ""}>${state.busy ? "Ingresando…" : "Entrar al panel"} ${icon("arrow")}</button></form></main>`;
  if (state.view === "products") return renderProducts(state);
  if (state.view === "settings") return renderSettings(state);
  const pending = state.orders.filter((o) => o.status === "pending").length;
  const confirmed = state.orders.filter((o) => o.status === "confirmed").length;
  const search = state.search.toLocaleLowerCase();
  const visible = state.orders.filter(
    (o) =>
      (state.filter === "all" || o.status === state.filter) &&
      [o.id, o.name, o.email].some((v) =>
        String(v).toLocaleLowerCase().includes(search),
      ),
  );
  const selected = state.orders.find((o) => o.id === state.selected);
  return `${adminNav(state)}<main id="main" class="page-width inner-page admin-page" tabindex="-1"><div class="section-heading"><div><h1>Órdenes.</h1><p>Cada antojo, en su lugar.</p></div><div class="button-row"><button class="text-button" data-admin-refresh ${state.loading ? "disabled" : ""}>${state.loading ? "Actualizando…" : "Actualizar"}</button></div></div><div class="admin-summary"><div><strong>${pending}</strong><span>Pendientes de revisión</span></div><div><strong>${confirmed}</strong><span>Órdenes confirmadas</span></div><div><strong>${formatMoney(state.orders.filter((o) => o.status === "confirmed").reduce((sum, o) => sum + o.total, 0))}</strong><span>Total confirmado</span></div></div>${state.error ? `<p class="checkout-message" role="alert">${e(state.error)}</p>` : ""}<div class="admin-toolbar"><div class="filter-row" aria-label="Estado de la orden">${[
    ["pending", "Pendientes"],
    ["confirmed", "Confirmadas"],
    ["all", "Todas"],
  ]
    .map(
      ([value, label]) =>
        `<button class="filter-button ${state.filter === value ? "is-active" : ""}" data-order-filter="${value}" aria-pressed="${state.filter === value}">${label}${value === "pending" ? ` <span>${pending}</span>` : ""}</button>`,
    )
    .join(
      "",
    )}</div><label class="search-field">${icon("search")}<span class="sr-only">Buscar órdenes</span><input type="search" id="order-search" placeholder="Nombre, correo o número" value="${e(state.search)}"></label></div><div class="admin-layout ${selected ? "has-selection" : ""}"><section class="orders-list" aria-label="Lista de órdenes">${visible.length ? `<div class="order-list-heading"><span>Pedido / cliente</span><span>Total</span><span>Estado</span></div>${visible.map((o) => `<button class="order-row ${selected?.id === o.id ? "is-selected" : ""}" data-order="${e(o.id)}" aria-label="Revisar pedido ${e(o.id)} de ${e(o.name)}"><div><strong>${e(o.name)}</strong><span>${e(o.id)} · ${date(o.createdAt)}</span><small>${e(o.email)}</small></div><strong>${formatMoney(o.total)}</strong><span class="status ${o.status === "confirmed" ? "confirmed" : "pending"}">${o.status === "confirmed" ? "Confirmado" : "Pendiente"}</span>${icon("chevron")}</button>`).join("")}` : `<div class="admin-empty">${icon("bag")}<h2>${state.search ? "Sin resultados." : "Todo al día."}</h2><p>${state.search ? "Prueba otro nombre, correo o número de pedido." : "Las órdenes aparecerán aquí cuando los clientes completen su pedido."}</p></div>`}</section>${selected ? renderOrderDetail(selected, state.busy) : ""}</div></main>`;
}

function adminNav(state) {
  const controls = state.authenticated
    ? `<nav class="admin-tabs" aria-label="Secciones de administración"><button data-admin-view="orders" class="${state.view === "orders" ? "is-active" : ""}" aria-pressed="${state.view === "orders"}">Órdenes</button><button data-admin-view="products" class="${state.view === "products" ? "is-active" : ""}" aria-pressed="${state.view === "products"}">Productos</button><button data-admin-view="settings" class="${state.view === "settings" ? "is-active" : ""}" aria-pressed="${state.view === "settings"}">Configuración</button></nav><button class="button button-outline admin-logout" data-admin-logout>Cerrar sesión</button>`
    : `<span>Administración</span>`;
  return `<header class="admin-shell-header"><span class="brand" aria-label="Snackyzz">${wordmark()}</span>${controls}</header>`;
}

function renderProducts(state) {
  const products = state.products ?? [];
  const visible = products.filter(
    (product) =>
      (state.productFilter === "all" ||
        (state.productFilter === "active" ? product.active : !product.active)) &&
      (!state.productBrandFilter || state.productBrandFilter === "all" ||
        productBrand(product) === state.productBrandFilter),
  );
  const editing =
    state.editingProduct === "new"
      ? null
      : products.find((product) => product.id === state.editingProduct);
  const showForm = state.editingProduct === "new" || editing;
  return `${adminNav(state)}<main id="main" class="page-width inner-page admin-page" tabindex="-1"><div class="section-heading"><div><h1>Productos.</h1><p>El catálogo que ven tus clientes.</p></div><div class="button-row"><button class="button button-dark" data-new-product>Nuevo producto ${icon("plus")}</button></div></div>${state.error ? `<p class="checkout-message" role="alert">${e(state.error)}</p>` : ""}<div class="admin-toolbar"><div class="product-filters"><div class="filter-row" role="group" aria-label="Marca del producto">${[
    ["all", "Todas las marcas"], ["snackyzz", "Snackyzz"], ["baking-stereo", "Baking Stereo"],
  ].map(([value, label]) => `<button id="brand-filter-${value}" class="filter-button ${(state.productBrandFilter || "all") === value ? "is-active" : ""}" data-product-brand-filter="${value}" aria-pressed="${(state.productBrandFilter || "all") === value}">${label}</button>`).join("")}</div><div class="filter-row" role="group" aria-label="Estado del producto">${[
    ["all", "Todos"],
    ["active", "Activos"],
    ["archived", "Archivados"],
  ]
    .map(
      ([value, label]) =>
        `<button class="filter-button ${state.productFilter === value ? "is-active" : ""}" data-product-filter="${value}" aria-pressed="${state.productFilter === value}">${label}</button>`,
    )
    .join(
      "",
    )}</div></div><button class="text-button" data-admin-refresh ${state.loading ? "disabled" : ""}>${state.loading ? "Actualizando…" : "Actualizar"}</button></div><div class="product-admin-layout ${showForm ? "has-selection" : ""}"><section class="admin-product-list" aria-label="Productos">${visible.length ? visible.map(renderProductRow).join("") : `<div class="admin-empty">${icon("bag")}<h2>${products.length ? "Sin coincidencias." : "Sin productos."}</h2><p>${products.length ? "Prueba otra marca o estado para ver más productos." : "Crea un producto para comenzar."}</p></div>`}</section>${showForm ? renderProductForm(editing, state.busy) : ""}</div></main>`;
}

function renderProductRow(product) {
  return `<article class="admin-product-row"><img src="${e(safeImage(product.image))}" alt=""><div><strong>${e(product.name)}</strong><span>${e(product.tag)} · ${formatMoney(product.price)}</span><small>${e(productBrandLabel(product))} · Posición ${product.position}</small></div><span class="status ${product.active ? "confirmed" : "pending"}">${product.active ? "Activo" : "Archivado"}</span><div class="product-row-actions"><button class="text-button" data-edit-product="${e(product.id)}">Editar</button>${product.active ? `<button class="text-button danger" data-archive-product="${e(product.id)}">Archivar</button>` : `<button class="text-button" data-restore-product="${e(product.id)}">Restaurar</button>`}</div></article>`;
}

function renderProductForm(product, busy) {
  const item = product ?? {
    id: "",
    name: "",
    price: "",
    description: "",
    tag: "",
    image: "",
    accent: "#ED781A",
    position: 1,
    active: true,
  };
  return `<form id="product-form" class="product-editor"><div class="cart-title"><h2>${product ? "Editar producto" : "Nuevo producto"}</h2><button type="button" class="icon-button" data-close-product aria-label="Cerrar editor">${icon("close")}</button></div><input type="hidden" name="id" value="${e(item.id)}"><input type="hidden" name="existingImage" value="${e(item.image)}"><div class="field"><label for="product-brand">Sección del catálogo</label><select id="product-brand" name="brand"><option value="snackyzz" ${(item.brand || "snackyzz") === "snackyzz" ? "selected" : ""}>Snackyzz · Cookies selladas</option><option value="baking-stereo" ${item.brand === "baking-stereo" ? "selected" : ""}>Snackyzz X Baking Stereo · Recién horneadas</option></select></div><div class="field"><label for="product-name">Nombre</label><input id="product-name" name="name" required maxlength="80" value="${e(item.name)}"></div><div class="product-form-grid"><div class="field"><label for="product-price">Precio (₡)</label><input id="product-price" name="price" type="number" required min="1" max="1000000" step="1" value="${e(item.price)}"></div><div class="field"><label for="product-position">Posición</label><input id="product-position" name="position" type="number" required min="0" max="999" step="1" value="${e(item.position)}"></div></div><div class="field"><label for="product-tag">Etiqueta corta</label><input id="product-tag" name="tag" required maxlength="40" value="${e(item.tag)}"></div><div class="field"><label for="product-description">Descripción</label><textarea id="product-description" name="description" required maxlength="500" rows="4">${e(item.description)}</textarea></div><div class="product-form-grid"><div class="field"><label for="product-accent">Color</label><input id="product-accent" name="accent" type="color" value="${e(item.accent)}"></div><div class="field"><label for="product-image">Imagen ${product ? "(opcional)" : ""}</label><input id="product-image" name="image" type="file" accept="image/jpeg,image/png" ${product ? "" : "required"}></div></div><small>JPG o PNG · Máximo 5 MB.</small><div class="button-row"><button class="button button-dark wide" ${busy ? "disabled" : ""}>${busy ? "Guardando…" : "Guardar producto"}</button></div></form>`;
}

function renderSettings(state) {
  const s = state.settings ?? {};
  const editing = state.editingLocation === "new" ? null : state.locations.find((item) => item.id === state.editingLocation);
  const locationForm = state.editingLocation ? renderLocationForm(editing, state.busy) : "";
  return `${adminNav(state)}<main id="main" class="page-width inner-page admin-page" tabindex="-1"><div class="section-heading"><div><h1>Configuración.</h1><p>Datos que ven tus clientes.</p></div></div>${state.error ? `<p class="checkout-message" role="alert">${e(state.error)}</p>` : ""}${state.emailConfigured ? `<p class="email-config-ok">${icon("check")} El envío de correos está configurado.</p>` : `<div class="notice email-config-warning"><strong>Los correos de confirmación aún no están configurados.</strong><p>Agrega RESEND_API_KEY y FROM_EMAIL como secretos de la función en Supabase. Estas credenciales no se guardan en este formulario.</p></div>`}<div class="settings-grid"><form id="store-settings-form" class="product-editor settings-editor"><h2>Datos de la tienda</h2><div class="product-form-grid"><div class="field"><label for="setting-sinpe">Número SINPE</label><input id="setting-sinpe" name="sinpeNumber" maxlength="30" value="${e(s.sinpe_number || "")}"></div><div class="field"><label for="setting-recipient">Destinatario SINPE</label><input id="setting-recipient" name="sinpeRecipient" maxlength="100" value="${e(s.sinpe_recipient || "")}"></div></div><div class="product-form-grid"><div class="field"><label for="setting-whatsapp">WhatsApp con código de país</label><input id="setting-whatsapp" name="whatsapp" maxlength="30" placeholder="+506 8888 8888" value="${e(s.whatsapp || "")}"></div><div class="field"><label for="setting-email">Correo público</label><input id="setting-email" name="publicEmail" type="email" maxlength="254" value="${e(s.public_email || "")}"></div></div><div class="field"><label for="setting-instagram">Instagram</label><input id="setting-instagram" name="instagram" maxlength="80" value="${e(s.instagram || "")}"></div><label class="check-field"><input type="checkbox" name="uberDeliveryEnabled" ${s.uber_delivery_enabled !== false ? "checked" : ""}> Ofrecer envío con mensajero</label><div class="field"><label for="delivery-lead">Anticipación mínima (horas)</label><input id="delivery-lead" name="deliveryLeadHours" type="number" min="0" max="168" required value="${e(s.delivery_lead_hours ?? 6)}"></div><input type="hidden" name="deliverySlotHours" value="${e(s.delivery_slot_hours ?? 3)}">${renderDeliverySchedule(s.delivery_schedule)}<div class="field"><label for="setting-disclaimer">Aviso de entrega</label><textarea id="setting-disclaimer" name="uberDisclaimer" required minlength="10" maxlength="300" rows="3">${e(s.uber_disclaimer || "")}</textarea></div><button class="button button-dark wide" ${state.busy ? "disabled" : ""}>Guardar configuración</button></form><section class="locations-admin"><div class="cart-title"><div><h2>Puntos de retiro</h2><p>Ubicaciones disponibles para clientes.</p></div><button class="button button-outline" data-new-location>Nuevo punto</button></div>${state.locations.length ? state.locations.map(renderLocationRow).join("") : `<div class="admin-empty"><h3>Sin puntos de retiro.</h3><p>Crea una ubicación para ofrecer retiro.</p></div>`}${locationForm}</section></div></main>`;
}
function renderDeliverySchedule(schedule = {}) {
  const days = [["mon","Lunes"],["tue","Martes"],["wed","Miércoles"],["thu","Jueves"],["fri","Viernes"],["sat","Sábado"],["sun","Domingo"]];
  return `<fieldset class="delivery-schedule"><legend>Horario disponible para entregas</legend>${days.map(([key,label]) => { const item=schedule[key]??{enabled:key!=="sun",start:"09:00",end:key==="sat"||key==="sun"?"15:00":"18:00"}; return `<div class="schedule-row"><label><input type="checkbox" name="delivery_${key}_enabled" ${item.enabled ? "checked" : ""}> ${label}</label><input type="time" name="delivery_${key}_start" aria-label="Inicio ${label}" required value="${e(item.start)}"><span>a</span><input type="time" name="delivery_${key}_end" aria-label="Fin ${label}" required value="${e(item.end)}"></div>`; }).join("")}</fieldset>`;
}
function renderLocationRow(point) {
  return `<article class="admin-location-row"><div><strong>${e(point.name)}</strong><span>${e(point.address)} · ${e(point.city)}</span><small>${e(point.hours || "Sin horario")}</small></div><span class="status ${point.active ? "confirmed" : "pending"}">${point.active ? "Activo" : "Archivado"}</span><div class="product-row-actions"><button class="text-button" data-edit-location="${e(point.id)}">Editar</button><button class="text-button ${point.active ? "danger" : ""}" data-location-action="${point.active ? "archive" : "restore"}" data-location-id="${e(point.id)}">${point.active ? "Archivar" : "Restaurar"}</button></div></article>`;
}
function renderLocationForm(point, busy) {
  const p = point ?? { id: "", name: "", city: "", address: "", hours: "", map_url: "", position: 1 };
  return `<form id="location-form" class="product-editor location-editor"><div class="cart-title"><h2>${point ? "Editar punto" : "Nuevo punto"}</h2><button type="button" class="icon-button" data-close-location aria-label="Cerrar editor">${icon("close")}</button></div><input type="hidden" name="id" value="${e(p.id)}"><div class="product-form-grid"><div class="field"><label for="location-name">Nombre</label><input id="location-name" name="name" required minlength="2" maxlength="100" value="${e(p.name)}"></div><div class="field"><label for="location-city">Ciudad</label><input id="location-city" name="city" required minlength="2" maxlength="100" value="${e(p.city)}"></div></div><div class="field"><label for="location-address">Dirección</label><textarea id="location-address" name="address" required minlength="5" maxlength="300" rows="3">${e(p.address)}</textarea></div><div class="field"><label for="location-hours">Horario</label><input id="location-hours" name="hours" maxlength="200" value="${e(p.hours)}"></div><div class="field"><label for="location-map">Enlace de Google Maps <span>(opcional)</span></label><input id="location-map" name="mapUrl" type="url" maxlength="500" value="${e(p.map_url)}"></div><div class="field"><label for="location-position">Posición</label><input id="location-position" name="position" type="number" required min="0" max="999" value="${e(p.position)}"></div><button class="button button-dark wide" ${busy ? "disabled" : ""}>Guardar punto</button></form>`;
}
function renderOrderDetail(order, busy) {
  const canRetryEmail = ["failed", "sending"].includes(order.emailStatus);
  return `<aside class="order-detail" aria-label="Detalle de la orden"><div class="cart-title"><h2>Revisar pedido</h2><button class="icon-button" data-close-order aria-label="Cerrar detalle">${icon("close")}</button></div><p class="order-id">${e(order.id)}</p><h3>${e(order.name)}</h3><p>${e(order.email)}${order.phone ? `<br>${e(order.phone)}` : ""}</p>${order.fulfillmentType ? `<div class="fulfillment-summary"><span>Entrega:</span> <strong>${order.fulfillmentType === "uber" ? "Envío con mensajero" : `Retiro en ${e(order.fulfillmentLabel || "punto de venta")}`}</strong><p>${e(order.fulfillmentAddress || "")}</p>${order.deliveryDate ? `<p><strong>Programado:</strong> ${e(order.deliveryDate)} · ${e(String(order.deliverySlotStart || "").slice(0,5))}–${e(String(order.deliverySlotEnd || "").slice(0,5))}</p>` : ""}</div>` : ""}<div class="order-items">${order.items.map((item) => `<div><span>${item.quantity} × ${e(item.name)}</span><strong>${formatMoney(item.price * item.quantity)}</strong></div>`).join("")}</div><div class="cart-total"><span>Total</span><strong>${formatMoney(order.total)}</strong></div><h3>Comprobante SINPE</h3><a href="${e(order.receiptUrl)}" target="_blank" rel="noopener noreferrer" class="receipt-link"><img src="${e(order.receiptUrl)}" alt="Comprobante SINPE del pedido ${e(order.id)}"><span>Abrir comprobante completo ${icon("arrow")}</span></a><p class="email-status ${canRetryEmail ? "is-error" : ""}">${icon("mail")} ${e(emailLabels[order.emailStatus] || order.emailStatus)}</p>${order.status === "pending" ? `<p class="admin-confirm-note">Confirma únicamente después de verificar el pago. Se enviará un correo al cliente.</p><button class="button button-dark wide" data-confirm-order="${e(order.id)}" ${busy ? "disabled" : ""}>${busy ? "Confirmando…" : "Confirmar pedido"} ${icon("check")}</button>` : `<p class="confirmed-note">${icon("check")} Confirmado ${date(order.confirmedAt)}</p>${canRetryEmail ? `<button class="button button-outline wide" data-retry-email="${e(order.id)}" ${busy ? "disabled" : ""}>${busy ? "Reintentando…" : "Reintentar correo"} ${icon("mail")}</button><p class="admin-confirm-note">Si el envío continúa activo, podrás reintentarlo cuando venza el bloqueo de seguridad.</p>` : ""}`}</aside>`;
}
