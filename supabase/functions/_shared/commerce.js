/** Validate administrator-defined package totals in whole colones. */
export function validatePackages(value = []) {
  if (!Array.isArray(value) || value.length > 20) throw new Error('Agrega hasta 20 paquetes por producto.');
  const seen = new Set();
  return value.map((pack) => {
    if (!pack || !Number.isInteger(pack.quantity) || pack.quantity < 2 || pack.quantity > 99 || !Number.isInteger(pack.price) || pack.price < 1 || pack.price > 1000000 || seen.has(pack.quantity)) {
      throw new Error('Revisa los paquetes: cantidades únicas de 2 a 99 y precios enteros de ₡1 a ₡1.000.000.');
    }
    seen.add(pack.quantity);
    return { quantity: pack.quantity, price: pack.price };
  }).sort((a, b) => a.quantity - b.quantity);
}

/** Find the cheapest exact combination of packages and individual cookies. */
export function productTotal(product, quantity) {
  const totals = [0];
  const options = [{quantity:1, price:product.price}, ...(product.packages || [])];
  for (let count = 1; count <= quantity; count++) {
    totals[count] = Math.min(...options.filter(pack => pack.quantity <= count).map(pack => totals[count - pack.quantity] + pack.price));
  }
  return totals[quantity];
}

export function validatePromotion(code, fulfillmentType, espinalResident) {
  const normalized = String(code || '').trim();
  if (!normalized) return '';
  if (normalized.toLowerCase() !== 'espinalsnackyzz') throw new Error('El código no es válido. Revisa e inténtalo de nuevo.');
  if (fulfillmentType !== 'uber') throw new Error('EspinalSnackyzz solo aplica a envío con mensajero.');
  if (espinalResident !== true) throw new Error('El envío gratis solo aplica para personas que viven en Espinal. Confirma tu residencia.');
  return 'EspinalSnackyzz';
}
