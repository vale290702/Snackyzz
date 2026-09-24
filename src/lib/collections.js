export const collections = {
  snackyzz: {
    title: "Snackyzz",
    description:
      "Cookies Snackyzz selladas, listas para acompañar tu próximo break.",
    label: "Snackyzz · Selladas",
  },
  "baking-stereo": {
    title: "Snackyzz X Baking Stereo",
    description:
      "Cookies de Baking Stereo recién salidas del horno. Otro antojo, el mismo carrito.",
    label: "Baking Stereo · Recién horneadas",
  },
};
export function productBrand(product) {
  return product.brand || "snackyzz";
}
export function productBrandLabel(product) {
  return collections[productBrand(product)]?.label || "Producto";
}
