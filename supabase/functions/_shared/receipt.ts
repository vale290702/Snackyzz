import { Image } from 'https://deno.land/x/imagescript@1.3.0/mod.ts';
import { InputError, MAX_BYTES, imageDimensions } from './validation.ts';

export async function normalizeReceipt(bytes: Uint8Array): Promise<Uint8Array> {
  if (!bytes.length || bytes.length > MAX_BYTES) throw new InputError('El comprobante debe pesar como máximo 5 MB.');
  const dimensions = imageDimensions(bytes);
  try {
    const image = await Image.decode(bytes);
    if (image.width !== dimensions.width || image.height !== dimensions.height) throw new Error('Dimensions mismatch');
    if (Math.max(image.width,image.height) > 2400) {
      const ratio = 2400 / Math.max(image.width,image.height);
      image.resize(Math.max(1,Math.round(image.width*ratio)),Math.max(1,Math.round(image.height*ratio)));
    }
    const normalized = await image.encodeJPEG(88);
    if (normalized.length > MAX_BYTES) throw new Error('Normalized image too large');
    return normalized;
  } catch {
    throw new InputError('El archivo no es una imagen válida. Usa JPG o PNG.');
  }
}
