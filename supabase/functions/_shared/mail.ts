export type MailPayload = {from?:string; to:string[]; subject:string; text:string; html?:string; attachments?:{filename:string;content:string;content_type:string;content_id:string}[]};
export type OrderMail = { id:string; name:string; email:string; total:number; status:string; rejectionReason?:string; confirmationComment?:string; items:{name:string;quantity:number;price:number}[] };
export type NewOrderMail = OrderMail & {createdAt?:string;phone?:string;fulfillmentLabel?:string;fulfillmentAddress?:string;
  deliveryDate?:string|null;deliverySlotStart?:string|null;deliverySlotEnd?:string|null;deliveryFee?:number};
export function adminRecipients(value: string): string[] {
  const recipients = [...new Set(value.split(',').map(email => email.trim()).filter(Boolean))];
  if (recipients.some(email => !/^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]+$/.test(email))) return [];
  return recipients;
}
export function newOrderMailPayload(order: NewOrderMail, from: string, recipients: string[]): MailPayload {
  const lines = [
    'Se registró una nueva orden pendiente de revisión.',
    '',
    `Orden: ${order.id}`,
    ...(order.createdAt ? [`Registrada: ${order.createdAt}`] : []),
    `Cliente: ${order.name}`,
    `Correo: ${order.email}`,
    ...(order.phone ? [`Teléfono: ${order.phone}`] : []),
    '',
    'Productos:',
    ...order.items.map(item => `${item.quantity} × ${item.name} — ₡${item.quantity * item.price}`),
    ...(order.deliveryFee ? [`Envío: ₡${order.deliveryFee}`] : []),
    `Total: ₡${order.total}`,
    '',
    `Entrega: ${order.fulfillmentLabel ?? 'Sin especificar'}`,
    ...(order.fulfillmentAddress ? [`Dirección: ${order.fulfillmentAddress}`] : []),
    ...(order.deliveryDate ? [`Fecha: ${order.deliveryDate}`] : []),
    ...(order.deliverySlotStart ? [`Horario: ${order.deliverySlotStart}${order.deliverySlotEnd ? `–${order.deliverySlotEnd}` : ''}`] : []),
    '',
    'Revisa el comprobante SINPE y confirma o rechaza la orden en el panel de administración.',
  ];
  return {from,to:recipients,subject:`Snackyzz · Nueva orden ${order.id.slice(0,8)} pendiente de revisión`,text:lines.join('\n')};
}
export function orderMailPayload(order: OrderMail, from: string, refundImage?: string): MailPayload {
  const rejected = order.status === 'rejected';
  const payload: MailPayload = {from,to:[order.email],
    subject:`Snackyzz · Orden ${order.id.slice(0,8)} ${rejected ? 'rechazada' : 'confirmada'}`,
    text: rejected
      ? `Hola ${order.name},\n\nTu orden no pudo ser aceptada.\n\nMotivo del rechazo:\n${order.rejectionReason}\n\nOrden: ${order.id}\n\nSi tienes alguna consulta sobre tu pedido o pago, escríbenos a Snackyzz.cookies@gmail.com.\n\nSnackyzz`
      : `Hola ${order.name},\n\nRevisamos tu comprobante SINPE y confirmamos tu orden.\n\n${order.items.map(i => `${i.quantity} × ${i.name} — ₡${i.quantity*i.price}`).join('\n')}\n\nTotal: ₡${order.total}\nOrden: ${order.id}\n\nGracias por elegir Snackyzz.\nSnackyzz.cookies@gmail.com`,
  };
  if (!rejected && order.confirmationComment?.trim()) payload.text += `\n\nComentario de Snackyzz:\n${order.confirmationComment.trim()}`;
  if (rejected && refundImage) {
    const escape = (value:string) => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
    payload.text += '\n\nComprobante de devolución SINPE adjunto.';
    payload.html = `<div style="font-family:Arial,sans-serif;color:#3B190B;max-width:600px"><p>${escape(payload.text).replace(/\n/g,'<br>')}</p><h2>Comprobante de devolución SINPE</h2><img src="cid:sinpe-refund" alt="Comprobante de devolución SINPE" style="max-width:100%;height:auto"></div>`;
    payload.attachments = [{filename:'devolucion-sinpe.jpg',content:refundImage,content_type:'image/jpeg',content_id:'sinpe-refund'}];
  }
  return payload;
}
export type MailResult = {status:'sent'|'failed';providerId?:string;error?:string};
export async function sendConfirmation(
  payload: MailPayload, orderId: string, key: string,
  transport: (input: string | URL | Request, init?: RequestInit) => Promise<Response> = fetch,
  event: "confirm" | "reject" | "new-order" = "confirm",
): Promise<MailResult> {
  if (!key || !payload.from) return {status:'failed',error:'Email provider is not configured'};
  try {
    const response = await transport('https://api.resend.com/emails', {
      method:'POST', headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json',
        'Idempotency-Key':`snackyzz-${event}-${orderId}`},
      body:JSON.stringify(payload), signal:AbortSignal.timeout(15000),
    });
    if (!response.ok) return {status:'failed',error:`Email provider HTTP ${response.status}`};
    const body = await response.json();
    if (typeof body.id !== 'string') return {status:'failed',error:'Email provider returned no identifier'};
    return {status:'sent',providerId:body.id};
  } catch {
    return {status:'failed',error:'Email provider connection failed'};
  }
}
