import {
  renderProductCard,
  renderCart,
  renderDemoNotice,
} from "../components/ui.js";
export function renderShop({ products, cart, demoCatalog }) {
  return `<main id="main" class="page-width inner-page" tabindex="-1"><div class="page-heading"><h1>Elige tu debilidad.</h1><p>Un poquito de esto, otro de aquello. Arma tu antojo.</p></div><div class="shop-layout"><section aria-label="Cookies disponibles"><div class="shop-toolbar"><span>${products.length} sabores para elegir</span><span>Hecho para tu break.</span></div><div class="product-grid shop-products">${products.map((p) => renderProductCard(p, cart)).join("")}</div>${renderDemoNotice(demoCatalog)}</section><div class="cart-column">${renderCart(cart)}</div></div></main>`;
}
