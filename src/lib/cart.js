const STORAGE_KEY = "snackyzz-cart";
const money = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
});
export const formatMoney = (value) => money.format(value);
export function createCartStore({ storage, products = [] } = {}) {
  if (storage === undefined) {
    try {
      storage = globalThis.localStorage;
    } catch {
      storage = null;
    }
  }
  const productMap = new Map(products.map((product) => [product.id, product]));
  let quantities = Object.create(null);
  try {
    const stored = JSON.parse(storage?.getItem(STORAGE_KEY) ?? "{}");
    if (stored && typeof stored === "object" && !Array.isArray(stored)) {
      for (const [id, qty] of Object.entries(stored)) {
        if (productMap.has(id) && Number.isInteger(qty) && qty > 0)
          quantities[id] = Math.min(qty, 99);
      }
    }
  } catch {
    /* Storage is optional; keep shopping available. */
  }
  function persist() {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(quantities));
    } catch {
      /* Session memory remains usable. */
    }
  }
  function changeQuantity(id, change) {
    if (!productMap.has(id) || !Number.isInteger(change)) return;
    const quantity = Math.min(99, Math.max(0, (quantities[id] ?? 0) + change));
    if (quantity) quantities[id] = quantity;
    else delete quantities[id];
    persist();
  }
  const getQuantity = (id) => quantities[id] ?? 0;
  const getLines = () =>
    products
      .filter((p) => getQuantity(p.id) > 0)
      .map((product) => ({
        product,
        quantity: getQuantity(product.id),
        total: product.price * getQuantity(product.id),
      }));
  const getTotal = () => getLines().reduce((sum, line) => sum + line.total, 0);
  return {
    changeQuantity,
    getQuantity,
    getLines,
    getTotal,
    getCount: () => Object.values(quantities).reduce((sum, n) => sum + n, 0),
    getFormattedTotal: () => formatMoney(getTotal()),
    clear() {
      quantities = Object.create(null);
      persist();
    },
  };
}
