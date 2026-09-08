export const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PIXELS = 12_000_000;
export class InputError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export type Item = { productId: string; quantity: number };
export function validateFields(form: FormData) {
  const name = String(form.get('name') ?? '').trim();
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const phone = String(form.get('phone') ?? '').trim();
  if (name.length < 2 || name.length > 120 || /[\x00-\x1f]/.test(name)) throw new InputError('Escribe un nombre válido.');
  if (email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email)) {
    throw new InputError('Escribe un correo válido para recibir la confirmación.');
  }
  if (phone.length > 32 || (phone && !/^[+()\d\s-]+$/.test(phone))) throw new InputError('Revisa el teléfono.');
  const raw = form.get('items');
  if (typeof raw !== 'string' || raw.length > 4096) throw new InputError('El carrito no es válido.');
  let items: unknown;
  try { items = JSON.parse(raw); } catch { throw new InputError('El carrito no es válido.'); }
  if (!Array.isArray(items) || items.length < 1 || items.length > 3) throw new InputError('Selecciona de uno a tres productos.');
  const seen = new Set<string>();
  const normalized: Item[] = items.map((item) => {
    if (!item || typeof item.productId !== 'string' || !/^[a-z0-9-]{1,80}$/.test(item.productId)
      || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99 || seen.has(item.productId)) {
      throw new InputError('Revisa los productos y las cantidades (1 a 99).');
    }
    seen.add(item.productId);
    return {productId:item.productId,quantity:item.quantity};
  });
  normalized.sort((a,b) => a.productId.localeCompare(b.productId));
  return {name,email,phone,items:normalized};
}

// Read bounded dimensions before allocating decoded pixels. A full decode follows.
export function imageDimensions(bytes: Uint8Array) {
  let width = 0, height = 0;
  const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  if (bytes.length >= 24 && [137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b)
    && String.fromCharCode(...bytes.slice(12,16)) === 'IHDR') {
    width = view.getUint32(16); height = view.getUint32(20);
  } else if (bytes[0] === 255 && bytes[1] === 216) {
    let pos = 2;
    while (pos + 3 < bytes.length) {
      if (bytes[pos++] !== 255) break;
      while (bytes[pos] === 255) pos++;
      const marker = bytes[pos++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (pos + 2 > bytes.length) break;
      const length = view.getUint16(pos);
      if (length < 2 || pos + length > bytes.length) break;
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && length >= 7) {
        height = view.getUint16(pos + 3); width = view.getUint16(pos + 5); break;
      }
      pos += length;
    }
  }
  if (!width || !height || width * height > MAX_PIXELS || width > 10000 || height > 10000) {
    throw new InputError('Usa una imagen JPG o PNG de hasta 12 megapíxeles.');
  }
  return {width,height};
}

export async function fingerprint(fields: ReturnType<typeof validateFields>, bytes: Uint8Array) {
  const receiptHash = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  const content = new TextEncoder().encode(JSON.stringify(fields) + Array.from(new Uint8Array(receiptHash), b => b.toString(16).padStart(2,'0')).join(''));
  const digest = await crypto.subtle.digest('SHA-256',content);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('');
}
