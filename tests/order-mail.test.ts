import { expect, test } from 'vitest';
import { adminRecipients, newOrderMailPayload, orderMailPayload, sendConfirmation } from '../supabase/functions/_shared/mail';
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
test('refund image is embedded and user content is escaped', () => {
  const payload = orderMailPayload({...order,name:'<Ana>',rejectionReason:'No <script>alert(1)</script>'},'orders@example.com','aW1hZ2U=');
  expect(payload.html).toContain('src="cid:sinpe-refund"');
  expect(payload.html).toContain('&lt;Ana&gt;');
  expect(payload.html).not.toContain('<script>');
  expect(payload.attachments).toEqual([{filename:'devolucion-sinpe.jpg',content:'aW1hZ2U=',content_type:'image/jpeg',content_id:'sinpe-refund'}]);
});
test('confirmation includes the saved admin comment and omits empty notes', () => {
  const comment = 'Tu pedido llegará mañana entre 2 y 4 p. m.\nGracias por tu compra.';
  expect(orderMailPayload({...order,status:'confirmed',confirmationComment:comment},'orders@example.com').text).toContain(`Comentario de Snackyzz:\n${comment}`);
  expect(orderMailPayload({...order,status:'confirmed',confirmationComment:''},'orders@example.com').text).not.toContain('Comentario de Snackyzz:');
  expect(orderMailPayload({...order,confirmationComment:comment},'orders@example.com').text).not.toContain(comment);
});
test('new order alert contains the details needed for review', () => {
  const recipients = adminRecipients('owner@example.com, manager@example.com, owner@example.com');
  expect(recipients).toEqual(['owner@example.com','manager@example.com']);
  const payload = newOrderMailPayload({...order,status:'pending',createdAt:'2026-10-17T18:00:00Z',phone:'8888-8888',
    fulfillmentLabel:'Envío con mensajero',fulfillmentAddress:'San José, Costa Rica',
    deliveryDate:'2026-10-19',deliverySlotStart:'09:00',deliverySlotEnd:'12:00',deliveryFee:1000},
  'orders@example.com',recipients);
  expect(payload.to).toEqual(recipients);
  expect(payload.subject).toContain('Nueva orden');
  for (const value of [order.id,'2026-10-17T18:00:00Z',order.name,order.email,'8888-8888','1 × Cookie','₡1000','₡4500',
    'Envío con mensajero','San José, Costa Rica','2026-10-19','09:00–12:00','pendiente de revisión']) {
    expect(payload.text).toContain(value);
  }
  expect(payload.text).not.toContain('confirmamos tu orden');
  expect(adminRecipients('owner@example.com, invalid-address')).toEqual([]);
});
test('new order alert has a separate stable provider key', async () => {
  let providerKey = '';
  const result = await sendConfirmation(newOrderMailPayload({...order,status:'pending'},'orders@example.com',['owner@example.com']),
    order.id,'test-key',async (_url, options) => {
      providerKey = new Headers(options?.headers).get('Idempotency-Key') || '';
      return Response.json({id:'sent-test'});
    },'new-order');
  expect(providerKey).toBe(`snackyzz-new-order-${order.id}`);
  expect(result.status).toBe('sent');
});
