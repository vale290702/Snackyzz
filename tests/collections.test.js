import test from "node:test";
import assert from "node:assert/strict";
import { renderShop } from "../src/pages/shop.js";
import { renderHome } from "../src/pages/home.js";
import { renderCart, renderNav } from "../src/components/ui.js";
import { createCartStore } from "../src/lib/cart.js";
import { getRouteFromHash } from "../src/lib/router.js";
const products = [
  {
    id: "sealed",
    name: "Sealed fixture",
    price: 1000,
    description: "Sealed cookie",
    tag: "Cookie",
    image: "/cookie.webp",
    accent: "classic",
  },
  {
    id: "fresh",
    name: "Fresh fixture",
    brand: "baking-stereo",
    price: 2000,
    description: "Fresh cookie",
    tag: "Cookie",
    image: "/cookie.webp",
    accent: "classic",
  },
];
const props = () => ({
  products,
  cart: createCartStore({ products, storage: null }),
  demoCatalog: false,
});
test("collections isolate products, including legacy Snackyzz products", () => {
  const state = props();
  const snackyzz = renderShop(state);
  const baking = renderShop({ ...state, collection: "baking-stereo" });
  assert.match(snackyzz, /Sealed fixture/);
  assert.doesNotMatch(snackyzz, /Fresh fixture/);
  assert.match(baking, /Fresh fixture/);
  assert.doesNotMatch(baking, /Sealed fixture/);
  assert.doesNotMatch(renderHome(state), /Fresh fixture/);
});
test("both collections retain a shared cart with identifiable brands", () => {
  const state = props();
  state.cart.changeQuantity("sealed", 1);
  state.cart.changeQuantity("fresh", 2);
  assert.equal(state.cart.getTotal(), 5000);
  for (const collection of ["snackyzz", "baking-stereo"]) {
    const html = renderShop({ ...state, collection });
    assert.match(html, /Sealed fixture/);
    assert.match(html, /Fresh fixture/);
  }
  const checkout = renderCart(state.cart, { checkout: true });
  assert.match(checkout, /Snackyzz · Selladas/);
  assert.match(checkout, /Baking Stereo · Recién horneadas/);
});
test("collaboration is navigable and empty catalog is explicit", () => {
  assert.equal(getRouteFromHash("#baking-stereo"), "baking-stereo");
  assert.match(
    renderNav({ activePage: "baking-stereo", cartCount: 0 }),
    /Snackyzz X Baking Stereo/,
  );
  assert.match(
    renderShop({ ...props(), products: [], collection: "baking-stereo" }),
    /Pronto saldrán del horno/,
  );
});
