import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { InputError } from './validation.ts';

export function serviceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new InputError('El servicio de pedidos todavía no está configurado.',503);
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
export type ServiceClient = ReturnType<typeof serviceClient>;

export function cors(request: Request) {
  const origin = request.headers.get('Origin');
  const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map(v => v.trim()).filter(Boolean);
  if (origin && !allowed.includes(origin)) throw new InputError('Este origen no está autorizado.',403);
  return {'Access-Control-Allow-Origin':origin ?? '', 'Vary':'Origin',
    'Access-Control-Allow-Headers':'authorization, apikey, x-client-info, content-type, idempotency-key',
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS', 'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff'};
}
export function json(value: unknown,status = 200,headers: Record<string,string> = {}) {
  return Response.json(value,{status,headers});
}
export function errorResponse(error: unknown,headers: Record<string,string>) {
  return json({error:error instanceof InputError ? error.message : 'No se pudo completar la solicitud. Intenta de nuevo.'},
    error instanceof InputError ? error.status : 500,headers);
}
export async function boundedForm(request: Request): Promise<FormData> {
  const max = 6 * 1024 * 1024;
  if (Number(request.headers.get('Content-Length')) > max) throw new InputError('El comprobante supera 5 MB.',413);
  if (!request.body) throw new InputError('Adjunta un comprobante.');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const {done,value} = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) { await reader.cancel(); throw new InputError('El comprobante supera 5 MB.',413); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) {bytes.set(chunk,offset); offset += chunk.length;}
  try {
    return await new Response(bytes,{headers:{'Content-Type':request.headers.get('Content-Type') ?? ''}}).formData();
  } catch { throw new InputError('El formulario no es válido.'); }
}
