import { validateFields, imageDimensions, MAX_BYTES } from './validation.ts';
import { normalizeReceipt } from './receipt.ts';
import { Image } from 'https://deno.land/x/imagescript@1.3.0/mod.ts';

function assert(value: unknown, message = 'Assertion failed'): asserts value {
  if (!value) throw new Error(message);
}
function rejects(fn: () => unknown) {
  let threw = false;
  try { fn(); } catch { threw = true; }
  assert(threw, 'Expected validation rejection');
}
function form(items: unknown = [{ productId: 'choco-cloud', quantity: 2 }]) {
  const f = new FormData();
  f.set('name', 'Ana Ejemplo'); f.set('email', 'ana@example.test');
  f.set('items', JSON.stringify(items));
  return f;
}
Deno.test('validates fields and ignores client prices', () => {
  const value = validateFields(form([{ productId: 'choco-cloud', quantity: 2, price: 1 }]));
  assert(value.items[0].quantity === 2);
  assert(!('price' in value.items[0]));
});
Deno.test('rejects malformed quantities, duplicate products and multiple mail recipients', () => {
  for (const quantity of [0, -1, 1.5, true, '2', 100]) {
    rejects(() => validateFields(form([{ productId: 'choco-cloud', quantity }])));
  }
  rejects(() => validateFields(form([{productId:'choco-cloud',quantity:1},{productId:'choco-cloud',quantity:1}])));
  const invalid = form(); invalid.set('email','ana,bob@example.test');
  rejects(() => validateFields(invalid));
});
Deno.test('rejects SVG, corrupt image and oversized file; normalizes real PNG into JPEG', async () => {
  for (const bytes of [new TextEncoder().encode('<svg/>'), new Uint8Array(MAX_BYTES + 1)]) {
    let threw = false;
    try { await normalizeReceipt(bytes); } catch { threw = true; }
    assert(threw);
  }
  const png = await new Image(20, 10).fill(0xed781aff).encode();
  const {width,height} = imageDimensions(png);
  assert(width === 20 && height === 10);
  const jpg = await normalizeReceipt(png);
  assert(jpg[0] === 255 && jpg[1] === 216);
  const decoded = await Image.decode(jpg);
  assert(decoded.width === 20 && decoded.height === 10);
});
