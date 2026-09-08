import test from "node:test";
import assert from "node:assert/strict";
import { createCartStore } from "../src/lib/cart.js";

const products = [
  { id: "a", price: 2500 },
  { id: "b", price: 2800 },
];
function storage(value) {
  let data = value;
  return {
    getItem: () => data,
    setItem: (_key, value) => {
      data = value;
    },
  };
}
test("cart quantities persist and totals use catalog prices", () => {
  const disk = storage("{}");
  const cart = createCartStore({ products, storage: disk });
  cart.changeQuantity("a", 2);
  cart.changeQuantity("b", 1);
  assert.equal(cart.getCount(), 3);
  assert.equal(cart.getTotal(), 7800);
  assert.equal(
    createCartStore({ products, storage: disk }).getQuantity("a"),
    2,
  );
  cart.changeQuantity("b", -2);
  assert.equal(cart.getQuantity("b"), 0);
  cart.clear();
  assert.equal(cart.getCount(), 0);
});
test("cart ignores invalid stored entries, unknown ids, and prototype properties", () => {
  const cart = createCartStore({
    products,
    storage: storage('{"a":2,"b":"3","ghost":999,"__proto__":5}'),
  });
  assert.equal(cart.getCount(), 2);
  assert.equal(cart.getTotal(), 5000);
});
test("cart caps counts and rejects non-integer changes", () => {
  const cart = createCartStore({ products, storage: storage("{}") });
  cart.changeQuantity("a", 150);
  assert.equal(cart.getQuantity("a"), 99);
  cart.changeQuantity("b", 1.5);
  cart.changeQuantity("b", NaN);
  cart.changeQuantity("ghost", 1);
  assert.equal(cart.getCount(), 99);
});
test("malformed and array local storage recover to empty cart", () => {
  for (const value of ["broken", "null", "[1,2,3]"]) {
    const cart = createCartStore({ products, storage: storage(value) });
    assert.equal(cart.getCount(), 0);
  }
});
test("storage failures do not prevent shopping", () => {
  const cart = createCartStore({
    products,
    storage: {
      getItem() {
        throw Error("blocked");
      },
      setItem() {
        throw Error("quota");
      },
    },
  });
  assert.doesNotThrow(() => cart.changeQuantity("a", 1));
  assert.equal(cart.getTotal(), 2500);
});
