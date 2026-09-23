import { boundedForm, cors, errorResponse, json, serviceClient } from '../_shared/http.ts';
import { InputError, MAX_BYTES, fingerprint, validateFields } from '../_shared/validation.ts';
import { normalizeReceipt } from '../_shared/receipt.ts';

Deno.serve(async (request: Request) => {
  let headers: Record<string,string> = {};
  try {
    headers = cors(request);
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers});
    if (request.method !== 'POST') throw new InputError('Método no permitido.',405);
    const key = request.headers.get('Idempotency-Key') ?? '';
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(key)) throw new InputError('Falta la clave del pedido. Recarga la página.');
    const form = await boundedForm(request);
    const fields = validateFields(form);
    const fulfillmentType = String(form.get('fulfillmentType') ?? '');
    const pickupLocationId = String(form.get('pickupLocationId') ?? '') || null;
    const deliveryAddress = String(form.get('deliveryAddress') ?? '').trim();
    const deliveryDate = String(form.get('deliveryDate') ?? '');
    const deliverySlotStart = String(form.get('deliverySlotStart') ?? '');
    if (!['pickup','uber'].includes(fulfillmentType)) throw new InputError('Selecciona retiro o entrega por Uber.');
    if (deliveryAddress.length > 300) throw new InputError('La dirección es demasiado larga.');
    const receipt = form.get('receipt');
    if (!(receipt instanceof File) || !receipt.size) throw new InputError('Adjunta una imagen del comprobante SINPE.');
    if (receipt.size > MAX_BYTES) throw new InputError('El comprobante debe pesar como máximo 5 MB.');
    const original = new Uint8Array(await receipt.arrayBuffer());
    if (fulfillmentType === 'uber' && (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate) || !/^\d{2}:\d{2}$/.test(deliverySlotStart))) throw new InputError('Selecciona la fecha y el horario de entrega.');
    const hash = await fingerprint({...fields,fulfillmentType,pickupLocationId,deliveryAddress,deliveryDate,deliverySlotStart},original);
    const bytes = await normalizeReceipt(original);
    const db = serviceClient();
    const path = `${crypto.randomUUID()}.jpg`;
    const {error:uploadError} = await db.storage.from('receipts').upload(path,bytes,{contentType:'image/jpeg',upsert:false});
    if (uploadError) throw new InputError('No se pudo guardar el comprobante. Intenta de nuevo.',503);
    const {data,error} = await db.rpc('create_order',{
      p_key:key,p_fingerprint:hash,p_name:fields.name,p_email:fields.email,p_phone:fields.phone,
      p_items:fields.items,p_receipt_path:path,
      p_fulfillment_type:fulfillmentType,p_pickup_location_id:pickupLocationId,p_delivery_address:deliveryAddress,
      p_delivery_date:deliveryDate || null,p_delivery_slot_start:deliverySlotStart || null,
    });
    if (error) {
      // Only delete on a definite transaction rejection. A transport failure can
      // hide a successful commit: preserve its receipt until reconciliation.
      if (error.code === 'P0001' || error.code?.startsWith('23')) {
        await db.storage.from('receipts').remove([path]);
      }
      if (error.message.includes('Idempotency conflict')) throw new InputError('Esta solicitud ya se usó para otro pedido.',409);
      throw new InputError('No se pudo registrar el pedido. Revisa el carrito e intenta de nuevo.',error.code === 'P0001' ? 400 : 503);
    }
    if (data.reused) await db.storage.from('receipts').remove([path]);
    return json({order:data.order},data.reused ? 200 : 201,headers);
  } catch (error) { return errorResponse(error,headers); }
});
