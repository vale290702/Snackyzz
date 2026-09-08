export type MailPayload = {from?:string; to:string[]; subject:string; text:string};
export type MailResult = {status:'sent'|'failed';providerId?:string;error?:string};
export async function sendConfirmation(
  payload: MailPayload, orderId: string, key: string,
  transport: (input: string | URL | Request, init?: RequestInit) => Promise<Response> = fetch,
): Promise<MailResult> {
  if (!key || !payload.from) return {status:'failed',error:'Email provider is not configured'};
  try {
    const response = await transport('https://api.resend.com/emails', {
      method:'POST', headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json',
        'Idempotency-Key':`snackyzz-confirm-${orderId}`},
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
