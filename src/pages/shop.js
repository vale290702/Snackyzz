import {
  renderProductCard,
  renderCart,
  renderDemoNotice,
  icon,
} from "../components/ui.js";
import { collections, productBrand } from "../lib/collections.js";
export function renderShop({
  products,
  cart,
  demoCatalog,
  collection = "snackyzz",
}) {
  const fresh = collection === "baking-stereo";
  const info = collections[collection];
  const visible = products.filter(
    (product) => productBrand(product) === collection,
  );
  return `<main id="main" class="page-width inner-page collection-page ${fresh ? "collection-fresh" : "collection-sealed"}" tabindex="-1"><div class="page-heading collection-heading"><h1>${fresh ? '<span class="collab-snackyzz">Snackyzz</span> <span class="collab-cross">X</span><br>Baking Stereo' : info.title}</h1><p>${info.description}</p></div><div class="shop-layout"><section aria-label="${info.title}"><div class="shop-toolbar"><span>${visible.length} ${visible.length === 1 ? "producto" : "productos"}</span><span>${fresh ? "Recién horneadas" : "Snackyzz · Cookies selladas"}</span></div>${visible.length ? `<div class="product-grid shop-products">${visible.map((p) => renderProductCard(p, cart)).join("")}</div>${renderDemoNotice(demoCatalog)}` : `<div class="collection-empty">${icon(fresh ? "oven" : "bag")}<h2>${fresh ? "Pronto saldrán del horno." : "Más antojos en camino."}</h2><p>${fresh ? "Aquí encontrarás los productos de Baking Stereo cuando estén disponibles." : "Aquí encontrarás las cookies Snackyzz cuando estén disponibles."}</p><a href="#${fresh ? "shop" : "baking-stereo"}" class="text-link">${fresh ? "Explorar las cookies Snackyzz" : "Conocer Baking Stereo"} ${icon("arrow")}</a></div>`}<div class="collection-switch"><p>Dos marcas. Un mismo carrito.</p><a href="#${fresh ? "shop" : "baking-stereo"}" class="text-link">${fresh ? "Ver las cookies Snackyzz" : "Ver Snackyzz X Baking Stereo"} ${icon("arrow")}</a></div></section><div class="cart-column">${renderCart(cart)}</div></div></main>`;
}
