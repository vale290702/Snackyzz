import { expect, test } from 'vitest';
import { orderMailPayload, sendConfirmation } from '../supabase/functions/_shared/mail';
const order = { id:'12345678-1234-1234-1234-123456789012',name:'Ana',email:'ana@example.com',total:4500,status:'rejected',rejectionReason:'El comprobante no coincide con el monto del pedido.',items:[{name:'Cookie',quantity:1,price:2500}] };
test('rejection email includes saved reason and order identity', () => {
  const payload = orderMailPayload(order, 'Snackyzz <orders@example.com>');
  expect(payload.subject).toContain('rechazada');
  expect(payload.text).toContain(order.rejectionReason);
  expect(payload.text).toContain(order.id);
  expect(payload.text).not.toContain('confirmamos tu orden');
});
test('confirmation wording remains intact', () => {
  const payload = orderMailPayload({...order,status:'confirmed'}, 'orders@example.com');
  expect(payload.subject).toContain('confirmada');
  expect(payload.text).toContain('confirmamos tu orden');
  expect(payload.text).not.toContain(order.rejectionReason);
});
test('rejection uses its own stable provider key', async () => {
  let providerKey = '';
  const result = await sendConfirmation(orderMailPayload(order,'orders@example.com'),order.id,'test-key',async (_url, options) => {
    providerKey = new Headers(options?.headers).get('Idempotency-Key') || '';
    return Response.json({id:'sent-test'});
  },'reject');
  expect(providerKey).toBe(`snackyzz-reject-${order.id}`);
  expect(result.status).toBe('sent');
});
