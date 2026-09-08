import { cors, errorResponse, json, serviceClient, type ServiceClient } from '../_shared/http.ts';
import { InputError } from '../_shared/validation.ts';
import { sendConfirmation, type MailPayload } from '../_shared/mail.ts';

type Order = {id:string;name:string;email:string;total:number;receiptPath:string;
  items:{name:string;quantity:number;price:number}[];[key:string]:unknown};
async function withReceipt(db: ServiceClient,order: Order) {
  const {data,error} = await db.storage.from('receipts').createSignedUrl(order.receiptPath,600);
  if (error) throw new InputError('No se pudo abrir el comprobante. Vuelve a cargar las órdenes.',503);
  const {receiptPath: _private,...result} = order;
  return {...result,receiptUrl:data.signedUrl};
}
async function deliver(db: ServiceClient,claim: {order:Order;claimToken:string;payload:MailPayload|null}) {
  const order = claim.order;
  const key = Deno.env.get('RESEND_API_KEY') ?? '';
  const from = Deno.env.get('FROM_EMAIL') ?? '';
  let result;
  if (!key || (!from && !claim.payload?.from)) {
    result = {status:'failed',error:'Email provider is not configured'};
  } else {
    const payload = claim.payload ?? {from,to:[order.email],
      subject:`Snackyzz · Orden ${order.id.slice(0,8)} confirmada`,
      text:`Hola ${order.name},\n\nRevisamos tu comprobante SINPE y confirmamos tu orden.\n\n${order.items.map(i => `${i.quantity} × ${i.name} — ₡${i.quantity*i.price}`).join('\n')}\n\nTotal: ₡${order.total}\nOrden: ${order.id}\n\nGracias por elegir Snackyzz.\nSnackyzz.cookies@gmail.com`,
    };
    // Freeze identical payload before contacting Resend; retries retain the same
    // provider key AND body, even when sender settings change between attempts.
    const {data:saved,error} = await db.rpc('prepare_email',{p_order_id:order.id,p_token:claim.claimToken,p_payload:payload});
    if (error) throw new InputError('La orden está confirmada; recarga para revisar el estado del correo.',503);
    result = await sendConfirmation(saved,order.id,key);
  }
  const {error} = await db.rpc('finish_email',{p_order_id:order.id,p_token:claim.claimToken,
    p_status:result.status,p_provider_id:'providerId' in result ? result.providerId : null,p_error:result.error ?? null});
  if (error) throw new InputError('La orden está confirmada; recarga para revisar el estado del correo.',503);
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
      const {data:urls,error:signError} = await db.storage.from('receipts').createSignedUrls(snapshots.map(o => o.receiptPath),600);
      if (signError || urls.some(url => !url.signedUrl)) throw new InputError('No se pudieron abrir los comprobantes. Recarga las órdenes.',503);
      const signed = new Map(urls.map(url => [url.path,url.signedUrl]));
      const orders = snapshots.map(({receiptPath,...order}) => ({...order,receiptUrl:signed.get(receiptPath)}));
      return json({orders},200,headers);
    }
    if (Number(request.headers.get('Content-Length')) > 4096) throw new InputError('Solicitud inválida.');
    const text = await request.text();
    if (text.length > 4096) throw new InputError('Solicitud inválida.');
    let body;
    try { body = JSON.parse(text); } catch { throw new InputError('Solicitud inválida.'); }
    if (!body || !['confirm','retry-email'].includes(body.action) || !/^[0-9a-f-]{36}$/.test(body.orderId)) throw new InputError('Solicitud inválida.');
    const {data:claim,error} = await db.rpc('claim_confirmation',{p_order_id:body.orderId,p_retry:body.action === 'retry-email'});
    if (error) throw new InputError(error.message.includes('not found') ? 'No se encontró la orden.' : 'No se pudo confirmar la orden.',error.message.includes('not found') ? 404 : 409);
    if (claim.claimed) await deliver(db,claim);
    const {data:order,error:snapshotError} = await db.rpc('order_snapshot',{p_order_id:body.orderId});
    if (snapshotError) throw new InputError('Recarga para revisar el estado de la orden.',503);
    return json({order:await withReceipt(db,order)},200,headers);
  } catch (error) { return errorResponse(error,headers); }
});
