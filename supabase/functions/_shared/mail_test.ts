import { sendConfirmation } from './mail.ts';

Deno.test('missing provider config never reports email sent', async () => {
  const result = await sendConfirmation({to:['ana@example.test'],subject:'Order',text:'Confirmed'}, 'order-1', '', async () => {
    throw new Error('Network must not be used');
  });
  if (result.status !== 'failed') throw new Error('Unconfigured email must fail visibly');
});
Deno.test('provider idempotency key stays stable and HTTP errors remain failures', async () => {
  const payload = {from:'orders@example.test',to:['ana@example.test'],subject:'Order',text:'Confirmed'};
  const captured: string[] = [];
  const transport = async (_input: string | URL | Request, init?: RequestInit) => {
    captured.push(new Headers(init?.headers).get('Idempotency-Key') ?? '');
    return Response.json({id:'email-id'});
  };
  const first = await sendConfirmation(payload, 'order-1', 'test-only', transport);
  await sendConfirmation(payload, 'order-1', 'test-only', transport);
  if (first.status !== 'sent' || first.providerId !== 'email-id' || captured[0] !== captured[1]) throw new Error('Idempotency failed');
  const failed = await sendConfirmation(payload, 'order-1', 'test-only', async () => new Response('{}', {status:500}));
  if (failed.status !== 'failed') throw new Error('Provider HTTP failure hidden');
});
