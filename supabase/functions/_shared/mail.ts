export type MailPayload = {from?:string; to:string[]; subject:string; text:string};
export type OrderMail = { id:string; name:string; email:string; total:number; status:string; rejectionReason?:string; items:{name:string;quantity:number;price:number}[] };
export function orderMailPayload(order: OrderMail, from: string): MailPayload {
  const rejected = order.status === 'rejected';
  return {from,to:[order.email],
    subject:`Snackyzz · Orden ${order.id.slice(0,8)} ${rejected ? 'rechazada' : 'confirmada'}`,
    text: rejected
      ? `Hola ${order.name},\n\nTu orden no pudo ser aceptada.\n\nMotivo del rechazo:\n${order.rejectionReason}\n\nOrden: ${order.id}\n\nSi tienes alguna consulta sobre tu pedido o pago, escríbenos a Snackyzz.cookies@gmail.com.\n\nSnackyzz`
      : `Hola ${order.name},\n\nRevisamos tu comprobante SINPE y confirmamos tu orden.\n\n${order.items.map(i => `${i.quantity} × ${i.name} — ₡${i.quantity*i.price}`).join('\n')}\n\nTotal: ₡${order.total}\nOrden: ${order.id}\n\nGracias por elegir Snackyzz.\nSnackyzz.cookies@gmail.com`,
  };
}
export type MailResult = {status:'sent'|'failed';providerId?:string;error?:string};
export async function sendConfirmation(
  payload: MailPayload, orderId: string, key: string,
  transport: (input: string | URL | Request, init?: RequestInit) => Promise<Response> = fetch,
  event: "confirm" | "reject" = "confirm",
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
