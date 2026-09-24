import { productBrandLabel } from "../lib/collections.js";
import { formatMoney } from "../lib/cart.js";
import { escapeHtml as e, safeImage } from "../lib/html.js";
const paths = {
  oven: "M3 4h18v17H3V4Zm0 5h18M7 13h10v5H7v-5ZM7 6.5h.01M11 6.5h.01M17 6.5h.01",
  bag: "M6 7h12l1 14H5L6 7Z M9 8V6a3 3 0 0 1 6 0v2",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  close: "m6 6 12 12M6 18 18 6",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  mail: "M3 5h18v14H3V5Zm0 1 9 7 9-7",
  check: "m5 12 4 4L19 6",
  upload: "M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6",
  chevron: "m9 5 7 7-7 7",
  lock: "M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4",
  search: "M21 21l-6-6M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  clock: "M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  menu: "M4 7h16M4 12h16M4 17h16",
  instagram:
    "M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm8 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm1-6h.01",
  flower: "M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4 18.4 5.6",
};
export function icon(name, className = "") {
  return `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.arrow}"/></svg>`;
}
export function wordmark() {
  return '<span class="wordmark">snackyzz<span class="brand-dot">.</span></span>';
}
export function renderNav({ activePage, cartCount }) {
  const links = [
    ["home", "Inicio"],
    ["shop", "Snackyzz"],
    ["baking-stereo", "Snackyzz X Baking Stereo"],
    ["sales", "Dónde encontrarnos"],
  ];
  return `<a href="#main" class="skip-link">Saltar al contenido</a><div class="announcement">Un pequeño break. Un gran antojo. <span>Eso es Snackyzz.</span></div><header class="site-header"><div class="nav-shell"><a href="#" class="brand" aria-label="Snackyzz, inicio">${wordmark()}</a><nav class="nav" aria-label="Navegación principal">${links.map(([id, label]) => `<a href="#${id === "home" ? "" : id}" class="nav-link ${activePage === id ? "is-active" : ""}" ${activePage === id ? 'aria-current="page"' : ""}>${label}</a>`).join("")}</nav><div class="nav-actions"><a href="#shop" class="cart-button" aria-label="Ver carrito, ${cartCount} productos">${icon("bag")}<span>Mi carrito</span><b data-cart-count>${cartCount}</b></a><button class="menu-button icon-button" data-menu aria-label="Abrir menú" aria-expanded="false">${icon("menu")}</button></div></div><nav class="mobile-nav" aria-label="Navegación móvil" hidden>${links.map(([id, label]) => `<a href="#${id === "home" ? "" : id}" ${activePage === id ? 'aria-current="page"' : ""}>${label}</a>`).join("")}</nav></header>`;
}
export function renderFooter(contact = {}) {
  const instagram = contact.instagram || "Snackyzz.cookies";
  const email = contact.email || "Snackyzz.cookies@gmail.com";
  return `<footer class="site-footer"><div class="footer-top"><div><a href="#" class="brand">${wordmark()}</a><p>La vida se disfruta<br>un bocado a la vez.</p></div><div class="footer-links"><h2>¿Se te antoja?</h2><a href="#shop">Snackyzz</a><a href="#baking-stereo">Snackyzz X Baking Stereo</a><a href="#sales">Dónde encontrarnos</a><a href="#about">Sobre Snackyzz</a></div><div class="footer-contact"><h2>Sigamos en contacto</h2><p class="social-handle">${icon("instagram")} @${e(instagram)}</p><a href="mailto:${e(email)}">${icon("mail")} ${e(email)}</a><p>Escríbenos. Nos encantará leerte.</p></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Snackyzz. Todos los derechos reservados.</span><a href="#admin">Administración ${icon("arrow")}</a></div></footer>`;
}
export function quantityControl(product, quantity) {
  return `<div class="stepper" aria-label="Cantidad de ${e(product.name)}"><button data-qty="-1" data-product="${e(product.id)}" aria-label="Quitar una ${e(product.name)}" ${quantity === 0 ? "disabled" : ""}>${icon("minus")}</button><output aria-label="Cantidad">${quantity}</output><button data-qty="1" data-product="${e(product.id)}" aria-label="Agregar una ${e(product.name)}" ${quantity >= 99 ? "disabled" : ""}>${icon("plus")}</button></div>`;
}
export function renderProductCard(product, cart) {
  const qty = cart.getQuantity(product.id);
  return `<article class="product-card"><button class="product-photo ${e(product.accent)}" data-detail="${e(product.id)}" aria-label="Ver detalles de ${e(product.name)}"><img src="${e(safeImage(product.image))}" alt="${e(product.name)}, imagen de referencia" width="640" height="640" loading="lazy"><span class="product-tag">${e(product.tag)}</span><span class="photo-action">Ver cookie ${icon("arrow")}</span></button><div class="product-heading"><h3><button data-detail="${e(product.id)}">${e(product.name)}</button></h3><span>${formatMoney(product.price)}</span></div><p class="product-brand">${e(productBrandLabel(product))}</p><p>${e(product.description)}</p><div class="product-purchase">${qty ? quantityControl(product, qty) : `<button class="add-button" data-qty="1" data-product="${e(product.id)}">Agregar al carrito ${icon("plus")}</button>`}</div></article>`;
}
export function renderCart(cart, { checkout = false, fulfillment } = {}) {
  const lines = cart.getLines();
  return `<aside class="cart-panel" aria-label="Resumen del carrito"><div class="cart-title"><h2>${checkout ? "Tu pedido" : "Tu antojo"}</h2><span>${cart.getCount()} ${cart.getCount() === 1 ? "producto" : "productos"}</span></div>${lines.length ? `<div class="cart-lines">${lines.map(({ product, quantity, total }) => `<div class="cart-line"><img src="${e(safeImage(product.image))}" alt="" width="64" height="64"><div class="cart-line-info"><h3>${e(product.name)}</h3><small class="cart-brand">${e(productBrandLabel(product))}</small>${checkout ? `<span>${quantity} × ${formatMoney(product.price)}</span>` : quantityControl(product, quantity)}</div><strong>${formatMoney(total)}</strong></div>`).join("")}</div>${checkout && fulfillment ? `<div class="fulfillment-summary"><span>Entrega:</span> <strong>${fulfillment.type === "uber" ? "Envío con mensajero" : "Retiro"}</strong></div>` : ""}<div class="cart-total"><span>Total de productos</span><strong>${cart.getFormattedTotal()}</strong></div>${checkout ? "" : `<a href="#checkout" class="button button-dark wide">Comprar ${icon("arrow")}</a><p class="cart-note">Pago por SINPE · Confirmación por correo</p><button class="text-button clear-cart" data-clear>Vaciar carrito</button>`}` : `<div class="empty-cart">${icon("bag")}<h3>Aquí cabe algo rico.</h3><p>Agrega tus cookies favoritas<br>y arma tu próximo antojo.</p></div><button class="button button-dark wide" disabled>Comprar ${icon("arrow")}</button>`}</aside>`;
}
export function renderDemoNotice(demo) {
  return demo
    ? '<p class="demo-notice">Catálogo de muestra · Sabores, precios e imágenes de referencia.</p>'
    : "";
}
