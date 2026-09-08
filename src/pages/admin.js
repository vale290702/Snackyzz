import { api } from "../lib/api.js";
import { escapeHtml as e } from "../lib/html.js";
import { formatMoney } from "../lib/cart.js";
import { icon } from "../components/ui.js";

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
    loading: false,
    busy: false,
    orders: [],
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
      const { orders } = await api("/admin/orders");
      if (requestRevision !== revision) return;
      state.authenticated = true;
      state.orders = orders;
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
      const { orders } = await api("/admin/orders");
      if (requestRevision !== revision) return;
      state.authenticated = true;
      state.orders = orders;
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
  return { state, load, login, logout, action, reset };
}
export function renderAdmin(state) {
  if (state.loading && !state.authenticated)
    return `<main id="main" class="page-width centered-page inner-page" tabindex="-1"><span class="spinner"></span><p>Cargando administración…</p></main>`;
  if (!state.authenticated)
    return `<main id="main" class="page-width admin-login-page" tabindex="-1"><div class="admin-welcome"><h1>Detrás de<br>cada <em>antojo.</em></h1><p>El espacio para revisar pedidos<br>y dar el siguiente paso.</p></div><form id="admin-login-form" class="login-form">${icon("lock")}<h2>Hola, equipo Snackyzz.</h2><p>Ingresa para gestionar tus órdenes.</p><div class="field"><label for="admin-email">Correo de administración</label><input id="admin-email" name="email" type="email" autocomplete="username" required></div><div class="field"><label for="admin-password">Contraseña de administración</label><input id="admin-password" name="password" type="password" autocomplete="current-password" required ${state.busy ? "disabled" : ""}></div>${state.error ? `<p class="checkout-message" role="alert">${e(state.error)}</p>` : ""}<button class="button button-dark wide" ${state.busy ? "disabled" : ""}>${state.busy ? "Ingresando…" : "Entrar al panel"} ${icon("arrow")}</button><a href="#shop" class="text-link">Volver a la tienda</a></form></main>`;
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
  return `<main id="main" class="page-width inner-page admin-page" tabindex="-1"><div class="section-heading"><div><h1>Órdenes.</h1><p>Cada antojo, en su lugar.</p></div><div class="button-row"><button class="text-button" data-admin-refresh ${state.loading ? "disabled" : ""}>${state.loading ? "Actualizando…" : "Actualizar"}</button><button class="button button-outline" data-admin-logout>Cerrar sesión</button></div></div><div class="admin-summary"><div><strong>${pending}</strong><span>Pendientes de revisión</span></div><div><strong>${confirmed}</strong><span>Órdenes confirmadas</span></div><div><strong>${formatMoney(state.orders.filter((o) => o.status === "confirmed").reduce((sum, o) => sum + o.total, 0))}</strong><span>Total confirmado</span></div></div>${state.error ? `<p class="checkout-message" role="alert">${e(state.error)}</p>` : ""}<div class="admin-toolbar"><div class="filter-row" aria-label="Estado de la orden">${[
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
function renderOrderDetail(order, busy) {
  const canRetryEmail = ["failed", "sending"].includes(order.emailStatus);
  return `<aside class="order-detail" aria-label="Detalle de la orden"><div class="cart-title"><h2>Revisar pedido</h2><button class="icon-button" data-close-order aria-label="Cerrar detalle">${icon("close")}</button></div><p class="order-id">${e(order.id)}</p><h3>${e(order.name)}</h3><p>${e(order.email)}${order.phone ? `<br>${e(order.phone)}` : ""}</p><div class="order-items">${order.items.map((item) => `<div><span>${item.quantity} × ${e(item.name)}</span><strong>${formatMoney(item.price * item.quantity)}</strong></div>`).join("")}</div><div class="cart-total"><span>Total</span><strong>${formatMoney(order.total)}</strong></div><h3>Comprobante SINPE</h3><a href="${e(order.receiptUrl)}" target="_blank" rel="noopener noreferrer" class="receipt-link"><img src="${e(order.receiptUrl)}" alt="Comprobante SINPE del pedido ${e(order.id)}"><span>Abrir comprobante completo ${icon("arrow")}</span></a><p class="email-status ${canRetryEmail ? "is-error" : ""}">${icon("mail")} ${e(emailLabels[order.emailStatus] || order.emailStatus)}</p>${order.status === "pending" ? `<p class="admin-confirm-note">Confirma únicamente después de verificar el pago. Se enviará un correo al cliente.</p><button class="button button-dark wide" data-confirm-order="${e(order.id)}" ${busy ? "disabled" : ""}>${busy ? "Confirmando…" : "Confirmar pedido"} ${icon("check")}</button>` : `<p class="confirmed-note">${icon("check")} Confirmado ${date(order.confirmedAt)}</p>${canRetryEmail ? `<button class="button button-outline wide" data-retry-email="${e(order.id)}" ${busy ? "disabled" : ""}>${busy ? "Reintentando…" : "Reintentar correo"} ${icon("mail")}</button><p class="admin-confirm-note">Si el envío continúa activo, podrás reintentarlo cuando venza el bloqueo de seguridad.</p>` : ""}`}</aside>`;
}
