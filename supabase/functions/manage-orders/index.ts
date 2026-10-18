import { boundedForm, cors, errorResponse, json, serviceClient, type ServiceClient } from '../_shared/http.ts';
import { normalizeReceipt } from '../_shared/receipt.ts';
import { encodeBase64 } from 'jsr:@std/encoding/base64';
import { InputError } from '../_shared/validation.ts';
import { sendConfirmation, orderMailPayload, type MailPayload } from '../_shared/mail.ts';

type Order = {id:string;name:string;email:string;total:number;receiptPath:string;status:string;rejectionReason?:string;confirmationComment?:string;refundReceiptPath?:string;
  items:{name:string;quantity:number;price:number}[];[key:string]:unknown};
async function withReceipt(db: ServiceClient,order: Order) {
  const {data,error} = await db.storage.from('receipts').createSignedUrl(order.receiptPath,600);
  if (error) throw new InputError('No se pudo abrir el comprobante. Vuelve a cargar las órdenes.',503);
  const {receiptPath: _private,refundReceiptPath,...result} = order;
  let refundReceiptUrl;
  if (refundReceiptPath) {
    const signed = await db.storage.from('refund-receipts').createSignedUrl(refundReceiptPath,600);
    if (signed.error) throw new InputError('No se pudo abrir el comprobante de devolución. Recarga las órdenes.',503);
    refundReceiptUrl = signed.data.signedUrl;
  }
  return {...result,receiptUrl:data.signedUrl,refundReceiptUrl};
}
async function deliver(db: ServiceClient,claim: {order:Order;claimToken:string;payload:MailPayload|null}) {
  const order = claim.order;
  const key = Deno.env.get('RESEND_API_KEY') ?? '';
  const from = Deno.env.get('FROM_EMAIL') ?? '';
  let result;
  if (!key || (!from && !claim.payload?.from)) {
    result = {status:'failed',error:'Email provider is not configured'};
  } else {
    let payload = claim.payload;
    if (!payload) {
      let refundImage;
      if (order.refundReceiptPath) {
        const download = await db.storage.from('refund-receipts').download(order.refundReceiptPath);
        if (download.error) {
          await db.rpc('finish_email',{p_order_id:order.id,p_token:claim.claimToken,p_status:'failed',p_provider_id:null,p_error:'Refund receipt could not be loaded'});
          throw new InputError('El rechazo quedó guardado. No se pudo cargar el comprobante para el correo; vuelve a intentar el envío.',503);
        }
        refundImage = encodeBase64(new Uint8Array(await download.data.arrayBuffer()));
      }
      payload = orderMailPayload(order,from,refundImage);
    }
    // Freeze identical payload before contacting Resend; retries retain the same
    // provider key AND body, even when sender settings change between attempts.
    const {data:saved,error} = await db.rpc('prepare_email',{p_order_id:order.id,p_token:claim.claimToken,p_payload:payload});
    if (error) throw new InputError('La decisión quedó guardada; recarga para revisar el estado del correo.',503);
    result = await sendConfirmation(saved,order.id,key,fetch,order.status === 'rejected' ? 'reject' : 'confirm');
  }
  const {error} = await db.rpc('finish_email',{p_order_id:order.id,p_token:claim.claimToken,
    p_status:result.status,p_provider_id:'providerId' in result ? result.providerId : null,p_error:result.error ?? null});
  if (error) throw new InputError('La decisión quedó guardada; recarga para revisar el estado del correo.',503);
}

Deno.serve(async (request: Request) => {
  let headers: Record<string,string> = {};
  try {
    headers = cors(request);
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers});
    if (!['GET','POST'].includes(request.method)) throw new InputError('Método no permitido.',405);
    const token = request.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) throw new InputError('Inicia sesión para revisar las órdenes.',401);
    const db = serviceClient();
    const {data:userData,error:authError} = await db.auth.getUser(token);
    if (authError || !userData.user) throw new InputError('La sesión venció. Vuelve a iniciar sesión.',401);
    const {data:admin,error:adminError} = await db.from('admin_users').select('user_id').eq('user_id',userData.user.id).maybeSingle();
    if (adminError) throw new InputError('No se pudieron verificar tus permisos.',503);
    if (!admin) throw new InputError('Esta cuenta no tiene acceso administrativo.',403);
    if (request.method === 'GET') {
      const {data,error} = await db.rpc('list_orders');
      if (error) throw new InputError('No se pudieron cargar las órdenes.',503);
      const snapshots = data as Order[];
      if (!snapshots.length) return json({orders:[]},200,headers);
      const orders = await Promise.all(snapshots.map(order => withReceipt(db,order)));
      return json({orders},200,headers);
    }
    let body;
    let refundReceipt: File | undefined;
    if (request.headers.get('Content-Type')?.includes('multipart/form-data')) {
      const form = await boundedForm(request);
      body = {orderId:form.get('orderId'),action:form.get('action'),reason:form.get('reason')};
      const file = form.get('refundReceipt');
      if (file instanceof File && file.size) refundReceipt = file;
    } else {
      if (Number(request.headers.get('Content-Length')) > 4096) throw new InputError('Solicitud inválida.');
      const text = await request.text();
      if (text.length > 4096) throw new InputError('Solicitud inválida.');
      try { body = JSON.parse(text); } catch { throw new InputError('Solicitud inválida.'); }
    }
    if (!body || !['confirm','reject','retry-email'].includes(body.action) || !/^[0-9a-f-]{36}$/.test(body.orderId)) throw new InputError('Solicitud inválida.');
    if (body.action === 'confirm' && body.comment != null && typeof body.comment !== 'string') throw new InputError('El comentario no es válido.');
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
    if (body.action === 'confirm' && (comment.length > 1000 || /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(comment))) throw new InputError('El comentario debe tener como máximo 1000 caracteres.');
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
    if (body.action === 'reject' && (reason.length < 5 || reason.length > 1000 || /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(reason))) throw new InputError('Escribe un motivo de rechazo de 5 a 1000 caracteres.');
    let refundPath: string | null = null;
    if (refundReceipt) {
      if (body.action !== 'reject') throw new InputError('El comprobante de devolución solo se adjunta al rechazar.');
      const image = await normalizeReceipt(new Uint8Array(await refundReceipt.arrayBuffer()));
      refundPath = `${body.orderId}/${crypto.randomUUID()}.jpg`;
      const upload = await db.storage.from('refund-receipts').upload(refundPath,image,{contentType:'image/jpeg',upsert:false});
      if (upload.error) throw new InputError('No se pudo guardar el comprobante. Inténtalo de nuevo.',503);
    }
    const {data:claim,error} = await db.rpc('claim_order_notification',{p_order_id:body.orderId,p_action:body.action,p_reason:body.action === 'reject' ? reason : body.action === 'confirm' ? comment : '',p_refund_path:refundPath});
    if (error) {
      // Remove only after a definite transaction rejection. Connection failures
      // may happen after commit, so keep the receipt available in that case.
      if (refundPath && error.code?.startsWith('P')) await db.storage.from('refund-receipts').remove([refundPath]);
      throw new InputError(error.message.includes('not found') ? 'No se encontró la orden.' : 'No se pudo actualizar la orden. Recarga para revisar su estado.',error.message.includes('not found') ? 404 : 409);
    }
    if (claim.claimed) await deliver(db,claim);
    const {data:order,error:snapshotError} = await db.rpc('order_snapshot',{p_order_id:body.orderId});
    if (snapshotError) throw new InputError('Recarga para revisar el estado de la orden.',503);
    return json({order:await withReceipt(db,order)},200,headers);
  } catch (error) { return errorResponse(error,headers); }
});
